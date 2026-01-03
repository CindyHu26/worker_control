'use client';

/**
 * RowActions Component
 * 
 * Icon-only action buttons for table rows.
 * Designed for sticky left column to maximize space efficiency.
 */

import React from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RowActionsProps {
    rowId: string;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
    onDelete?: (id: string) => void;
    /** Hide specific actions */
    hideView?: boolean;
    hideEdit?: boolean;
    hideDelete?: boolean;
}

export default function RowActions({
    rowId,
    onView,
    onEdit,
    onDelete,
    hideView = false,
    hideEdit = false,
    hideDelete = false,
}: RowActionsProps) {
    return (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {!hideView && onView && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="檢視"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(rowId);
                    }}
                >
                    <Eye className="h-3.5 w-3.5 text-blue-600" />
                </Button>
            )}

            {!hideEdit && onEdit && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="編輯"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(rowId);
                    }}
                >
                    <Pencil className="h-3.5 w-3.5 text-orange-600" />
                </Button>
            )}

            {!hideDelete && onDelete && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    title="刪除"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(rowId);
                    }}
                >
                    <Trash2 className="h-3.5 w-3.5 text-red-600" />
                </Button>
            )}
        </div>
    );
}
