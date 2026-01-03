'use client';

/**
 * SmartTable Component
 * 
 * A dynamic data table that renders columns based on schema definition.
 * Handles hybrid data model (Core fields at root, Dynamic fields in JSONB attributes).
 * 
 * Features:
 * - Row click navigates to View mode (read-only by default)
 * - Action buttons use stopPropagation to prevent row click interference
 * - Delete uses AlertDialog for confirmation (safer than window.confirm)
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FieldConfig } from '@/types/form-config';
import { getFieldValue } from '@/lib/form-utils';
import { apiDelete } from '@/lib/api';
import { Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState<{ id: string; name?: string } | null>(null);

    // Generate visible columns - limit to reasonable count for display
    const visibleColumns = schema.slice(0, 6);

    // Row click -> Navigate to View mode (read-only detail page)
    const handleRowClick = (id: string) => {
        router.push(`/sys/${entity}/${id}`);
    };

    // Edit button -> Navigate to Edit mode
    const handleEdit = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // CRITICAL: Prevent row click
        router.push(`/sys/${entity}/${id}?mode=edit`);
    };

    // View button -> Navigate to View mode (same as row click, but explicit)
    const handleView = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent row click
        router.push(`/sys/${entity}/${id}`);
    };

    // Delete button -> Open confirmation dialog
    const handleDeleteClick = (e: React.MouseEvent, row: Record<string, any>) => {
        e.stopPropagation(); // CRITICAL: Prevent row click
        const displayName = row.name || row.englishName || row.chineseName || row.companyName || row.code || row.id?.substring(0, 8);
        setRecordToDelete({ id: row.id, name: displayName });
        setDeleteDialogOpen(true);
    };

    // Confirmed delete action
    const handleDeleteConfirm = async () => {
        if (!recordToDelete) return;

        try {
            setDeleting(recordToDelete.id);
            await apiDelete(`/api/data/${entity}/${recordToDelete.id}`);
            onRefresh?.();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete record');
        } finally {
            setDeleting(null);
            setDeleteDialogOpen(false);
            setRecordToDelete(null);
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
                            <TableHead className="w-[140px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, index) => (
                            <TableRow
                                key={row.id || index}
                                onClick={() => handleRowClick(row.id)}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                            >
                                {visibleColumns.map((field) => (
                                    <TableCell key={field.name}>
                                        {renderCellValue(row, field)}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleView(e, row.id)}
                                            title="檢視 (View)"
                                        >
                                            <Eye className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleEdit(e, row.id)}
                                            title="編輯 (Edit)"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => handleDeleteClick(e, row)}
                                            disabled={deleting === row.id}
                                            title="刪除 (Delete)"
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

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除？</AlertDialogTitle>
                        <AlertDialogDescription>
                            您確定要刪除 <strong>{recordToDelete?.name || '此記錄'}</strong> 嗎？
                            <br />
                            此操作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!deleting}>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={!!deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? '刪除中...' : '確認刪除'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
