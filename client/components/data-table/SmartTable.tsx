'use client';

/**
 * SmartTable Component
 * 
 * A dynamic data table that renders columns based on schema definition.
 * Handles hybrid data model (Core fields at root, Dynamic fields in JSONB attributes).
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FieldConfig } from '@/types/form-config';
import { getFieldValue } from '@/lib/form-utils';
import { apiDelete } from '@/lib/api';
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface SmartTableProps {
    entity: string;
    schema: FieldConfig[];
    data: Record<string, any>[];
    meta?: PaginationMeta;
    onPageChange?: (page: number) => void;
    onRefresh?: () => void;
    loading?: boolean;
}

export default function SmartTable({
    entity,
    schema,
    data,
    meta,
    onPageChange,
    onRefresh,
    loading = false,
}: SmartTableProps) {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);

    // Generate visible columns - limit to reasonable count for display
    const visibleColumns = schema.slice(0, 6);

    const handleEdit = (id: string) => {
        router.push(`/sys/${entity}/${id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this record?')) {
            return;
        }

        try {
            setDeleting(id);
            await apiDelete(`/api/data/${entity}/${id}`);
            onRefresh?.();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete record');
        } finally {
            setDeleting(null);
        }
    };

    const renderCellValue = (row: Record<string, any>, field: FieldConfig): React.ReactNode => {
        const value = getFieldValue(row, field.name, field.isCore);

        if (value === null || value === undefined) {
            return <span className="text-muted-foreground">-</span>;
        }

        // Handle different field types
        switch (field.type) {
            case 'boolean':
                return value ? '✓' : '✗';
            case 'date':
                try {
                    return new Date(value).toLocaleDateString('zh-TW');
                } catch {
                    return String(value);
                }
            case 'select':
                // Try to find the label from options
                const option = field.options?.find(opt => opt.value === value);
                return option?.label || String(value);
            case 'number':
                return typeof value === 'number' ? value.toLocaleString() : String(value);
            default:
                return String(value);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No records found.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {visibleColumns.map((field) => (
                                <TableHead key={field.name}>
                                    {field.label}
                                    {field.isCore && (
                                        <span className="ml-1 text-xs text-blue-500" title="Core field">●</span>
                                    )}
                                </TableHead>
                            ))}
                            <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow key={row.id || index}>
                                {visibleColumns.map((field) => (
                                    <TableCell key={field.name}>
                                        {renderCellValue(row, field)}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(row.id)}
                                            title="Edit"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(row.id)}
                                            disabled={deleting === row.id}
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} records
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(meta.page - 1)}
                            disabled={!meta.hasPrevPage}
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm">
                            Page {meta.page} of {meta.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange?.(meta.page + 1)}
                            disabled={!meta.hasNextPage}
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
