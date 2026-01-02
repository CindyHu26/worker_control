'use client';

/**
 * Universal Entity List Page
 * 
 * Dynamic list view for any entity that follows the Universal Entity Architecture.
 * Fetches schema and data from the generic /api/data/:entity endpoint.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SmartTable from '@/components/data-table/SmartTable';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { FieldConfig } from '@/types/form-config';
import { apiGet } from '@/lib/api';
import { Plus, RefreshCw } from 'lucide-react';

interface SchemaResponse {
    entityCode: string;
    fields: FieldConfig[];
    meta: {
        totalFields: number;
        coreFields: number;
        dynamicFields: number;
    };
}

interface DataResponse {
    data: Record<string, any>[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

// Entity display name mapping
const ENTITY_DISPLAY_NAMES: Record<string, string> = {
    worker: 'Workers',
    employer: 'Employers',
    dormitory: 'Dormitories',
    agency: 'Agencies',
};

export default function EntityListPage() {
    const router = useRouter();
    const params = useParams();
    const entity = params.entity as string;

    const [schema, setSchema] = useState<FieldConfig[]>([]);
    const [data, setData] = useState<Record<string, any>[]>([]);
    const [meta, setMeta] = useState<DataResponse['meta'] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const displayName = ENTITY_DISPLAY_NAMES[entity] || entity.charAt(0).toUpperCase() + entity.slice(1);

    const fetchData = useCallback(async (pageNum: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            // Fetch schema and data in parallel
            const [schemaRes, dataRes] = await Promise.all([
                apiGet<SchemaResponse>(`/api/data/${entity}/schema`),
                apiGet<DataResponse>(`/api/data/${entity}?page=${pageNum}&limit=20`),
            ]);

            setSchema(schemaRes.fields);
            setData(dataRes.data);
            setMeta(dataRes.meta);
            setPage(pageNum);
        } catch (err: any) {
            console.error('Failed to fetch data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [entity]);

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handlePageChange = (newPage: number) => {
        fetchData(newPage);
    };

    const handleRefresh = () => {
        fetchData(page);
    };

    const handleCreate = () => {
        router.push(`/sys/${entity}/new`);
    };

    if (error) {
        return (
            <StandardPageLayout title="Error" description="Failed to load data">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-destructive">
                            <h2 className="text-xl font-semibold mb-2">Error</h2>
                            <p>{error}</p>
                            <Button onClick={() => fetchData(1)} className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title={displayName}
            description={`Manage ${displayName.toLowerCase()} using the Universal Entity Architecture`}
            actions={
                <>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                {/* Schema Info Badge */}
                {schema.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {schema.filter(f => f.isCore).length} Core Fields
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            {schema.filter(f => !f.isCore).length} Dynamic Fields
                        </span>
                    </div>
                )}

                {/* Data Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Records</CardTitle>
                        <CardDescription>
                            {meta ? `${meta.total} total records` : 'Loading...'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SmartTable
                            entity={entity}
                            schema={schema}
                            data={data}
                            meta={meta || undefined}
                            onPageChange={handlePageChange}
                            onRefresh={handleRefresh}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}
