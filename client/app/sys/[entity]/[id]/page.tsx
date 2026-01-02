'use client';

/**
 * Universal Entity Detail/Edit Page
 * 
 * Dynamic form view for creating or editing any entity.
 * Handles both 'new' (Create) and UUID (Edit) routes.
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SmartForm from '@/components/form/SmartForm';
import { FieldConfig } from '@/types/form-config';
import { apiGet, apiPost, apiPut } from '@/lib/api';
import { flattenEntityData } from '@/lib/form-utils';
import { ArrowLeft, Save } from 'lucide-react';

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
    const entity = params.entity as string;
    const id = params.id as string;

    const isNew = id === 'new';

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
            } else {
                await apiPut(`/api/data/${entity}/${id}`, data);
            }

            // Navigate back to list page
            router.push(`/sys/${entity}`);
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

    if (loading) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error && !schema.length) {
        return (
            <div className="container mx-auto py-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-destructive">
                            <h2 className="text-xl font-semibold mb-2">Error</h2>
                            <p>{error}</p>
                            <Button onClick={handleBack} className="mt-4">
                                Back to List
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={handleBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isNew ? `New ${displayName}` : `Edit ${displayName}`}
                        </h1>
                        <p className="text-muted-foreground">
                            {isNew
                                ? `Create a new ${displayName.toLowerCase()} record`
                                : `Editing record: ${id.substring(0, 8)}...`
                            }
                        </p>
                    </div>
                </div>
            </div>

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
                        Fill in the fields below. Fields marked with ● are core database columns.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SmartForm
                        config={schema}
                        defaultValues={defaultValues}
                        onSubmit={handleSubmit}
                        submitLabel={
                            saving
                                ? 'Saving...'
                                : isNew
                                    ? 'Create'
                                    : 'Save Changes'
                        }
                        className="max-w-2xl"
                    />
                </CardContent>
            </Card>

            {/* Debug Info (dev only) */}
            {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Debug: Schema Info</summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto max-h-48">
                        {JSON.stringify({ entity, id, isNew, schemaCount: schema.length }, null, 2)}
                    </pre>
                </details>
            )}
        </div>
    );
}
