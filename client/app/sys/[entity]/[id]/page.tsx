'use client';

/**
 * Universal Entity Detail/Edit Page
 * 
 * Dynamic form view for creating or editing any entity.
 * Handles both 'new' (Create) and UUID (Edit) routes.
 * 
 * URL Strategy:
 * - Default (/sys/worker/123): View Mode (read-only)
 * - Edit (/sys/worker/123?mode=edit): Edit Mode (editable)
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SmartForm from '@/components/form/SmartForm';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { FieldConfig } from '@/types/form-config';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { flattenEntityData } from '@/lib/form-utils';
import { ArrowLeft, Pencil, X, Save, Eye } from 'lucide-react';

interface SchemaResponse {
    entityCode: string;
    fields: FieldConfig[];
    meta: {
        totalFields: number;
        coreFields: number;
        dynamicFields: number;
    };
}

// Entity display name mapping
const ENTITY_DISPLAY_NAMES: Record<string, string> = {
    worker: 'Worker',
    employer: 'Employer',
    dormitory: 'Dormitory',
    agency: 'Agency',
};

export default function EntityDetailPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const entity = params.entity as string;
    const id = params.id as string;
    const isNew = id === 'new';

    // Mode: 'view' (default) or 'edit'
    const mode = searchParams.get('mode') === 'edit' ? 'edit' : 'view';
    const isEditMode = mode === 'edit' || isNew; // New records are always in edit mode

    const [schema, setSchema] = useState<FieldConfig[]>([]);
    const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const displayName = ENTITY_DISPLAY_NAMES[entity] || entity.charAt(0).toUpperCase() + entity.slice(1);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                // Fetch schema
                const schemaRes = await apiGet<SchemaResponse>(`/api/data/${entity}/schema`);
                setSchema(schemaRes.fields);

                // If editing, fetch existing record
                if (!isNew) {
                    const record = await apiGet<Record<string, any>>(`/api/data/${entity}/${id}`);
                    // Flatten hybrid data for form consumption
                    const flatData = flattenEntityData(record);
                    setDefaultValues(flatData);
                }
            } catch (err: any) {
                console.error('Failed to load data:', err);
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [entity, id, isNew]);

    const handleSubmit = async (data: any) => {
        try {
            setSaving(true);
            setError(null);

            if (isNew) {
                await apiPost(`/api/data/${entity}`, data);
                // Navigate back to list page after creation
                router.push(`/sys/${entity}`);
            } else {
                await apiPut(`/api/data/${entity}/${id}`, data);
                // Return to View mode after save
                router.push(`/sys/${entity}/${id}`);
            }
        } catch (err: any) {
            console.error('Failed to save:', err);
            setError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        router.push(`/sys/${entity}`);
    };

    const handleEdit = () => {
        router.push(`/sys/${entity}/${id}?mode=edit`);
    };

    const handleCancelEdit = () => {
        router.push(`/sys/${entity}/${id}`);
    };

    // Determine page title based on mode
    const getPageTitle = () => {
        if (isNew) return `新增 ${displayName}`;
        if (isEditMode) return `編輯 ${displayName}`;
        return `檢視 ${displayName}`;
    };

    // Determine page description
    const getPageDescription = () => {
        if (isNew) return `Create a new ${displayName.toLowerCase()} record`;
        if (isEditMode) return `Editing record: ${id.substring(0, 8)}...`;
        return `Viewing record details`;
    };

    // Render action buttons based on mode
    const renderActions = () => {
        if (isNew) {
            return (
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    取消
                </Button>
            );
        }

        if (isEditMode) {
            return (
                <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 mr-2" />
                        取消編輯
                    </Button>
                </>
            );
        }

        // View mode
        return (
            <>
                <Button variant="outline" onClick={handleBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回列表
                </Button>
                <Button onClick={handleEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    編輯
                </Button>
            </>
        );
    };

    if (loading) {
        return (
            <StandardPageLayout
                title="Loading..."
                description="Please wait"
            >
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            </StandardPageLayout>
        );
    }

    if (error && !schema.length) {
        return (
            <StandardPageLayout
                title="Error"
                description="Failed to load"
                actions={
                    <Button variant="outline" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to List
                    </Button>
                }
            >
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-destructive">
                            <h2 className="text-xl font-semibold mb-2">Error</h2>
                            <p>{error}</p>
                        </div>
                    </CardContent>
                </Card>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title={getPageTitle()}
            description={getPageDescription()}
            actions={renderActions()}
        >
            <div className="space-y-4">
                {/* Mode Indicator */}
                {!isNew && (
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isEditMode
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {isEditMode ? (
                                <>
                                    <Pencil className="h-3 w-3 mr-1.5" />
                                    編輯模式
                                </>
                            ) : (
                                <>
                                    <Eye className="h-3 w-3 mr-1.5" />
                                    檢視模式
                                </>
                            )}
                        </span>
                    </div>
                )}

                {/* Error Display */}
                {error && (
                    <div className="rounded-md bg-destructive/15 p-4 text-destructive">
                        {error}
                    </div>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                        <CardDescription>
                            {isEditMode
                                ? 'Fill in the fields below. Fields marked with ● are core database columns.'
                                : 'View record details. Click "編輯" to make changes.'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SmartForm
                            config={schema}
                            defaultValues={defaultValues}
                            onSubmit={handleSubmit}
                            submitLabel={
                                saving
                                    ? '儲存中...'
                                    : isNew
                                        ? '建立'
                                        : '儲存變更'
                            }
                            className="max-w-2xl"
                            readonly={!isEditMode}
                        />
                    </CardContent>
                </Card>

                {/* Debug Info (dev only) */}
                {process.env.NODE_ENV === 'development' && (
                    <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">Debug: Schema Info</summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-48">
                            {JSON.stringify({ entity, id, isNew, mode, isEditMode, schemaCount: schema.length }, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </StandardPageLayout>
    );
}
