'use client';

/**
 * UniversalListPage Component
 * 
 * A reusable, full-height list page template for all entity modules.
 * Provides consistent layout, data fetching, search, and pagination.
 * Defaults to compact mode for high-density display (15-20 rows visible).
 */

import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, X, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { apiGet } from '@/lib/api';
import RowActions from '@/components/data-table/RowActions';

// Column configuration for simple list display
export interface ColumnConfig {
    key: string;
    label: string;
    /** Whether this is a core DB column (vs JSONB attribute) */
    isCore?: boolean;
    /** Optional width class */
    width?: string;
    /** Custom render function */
    render?: (value: any, row: any) => ReactNode;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface UniversalListPageProps {
    /** Page title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Entity slug for routing (e.g., "employers", "workers") */
    entitySlug: string;
    /** API endpoint for fetching data */
    apiEndpoint: string;
    /** Column definitions for the table */
    columns: ColumnConfig[];
    /** Display density */
    density?: 'normal' | 'compact';
    /** Optional filter/tab component */
    filterComponent?: ReactNode;
    /** Optional custom create button */
    createButton?: ReactNode;
    /** Default page size */
    defaultLimit?: number;
    /** Search placeholder text */
    searchPlaceholder?: string;
    /** Hide create button */
    hideCreate?: boolean;
    /** Enable row selection */
    selectable?: boolean;
    /** Callback for selection changes */
    onSelectionChange?: (ids: Set<string>) => void;
    /** External selection state (optional) */
    selectedIds?: Set<string>;
}

export default function UniversalListPage({
    title,
    subtitle,
    entitySlug,
    apiEndpoint,
    columns,
    density = 'compact',
    filterComponent,
    createButton,
    defaultLimit = 20,
    searchPlaceholder = '搜尋...',
    hideCreate = false,
    selectable = false,
    onSelectionChange,
    selectedIds: externalSelectedIds,
}: UniversalListPageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [data, setData] = useState<any[]>([]);
    const [meta, setMeta] = useState<PaginationMeta>({ total: 0, page: 1, limit: defaultLimit, totalPages: 1 });
    const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());

    // Detect URL filters for drill-down navigation
    const urlFilters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
        // Exclude known non-filter params
        if (!['page', 'limit', 'q'].includes(key)) {
            urlFilters[key] = value;
        }
    });
    const hasActiveFilters = Object.keys(urlFilters).length > 0;

    const clearFilters = () => {
        router.push(`/${entitySlug}`);
    };

    // Use external or internal selection
    const selectedIds = externalSelectedIds || internalSelectedIds;

    const handleSelectionChange = useCallback((newSet: Set<string>) => {
        if (!externalSelectedIds) {
            setInternalSelectedIds(newSet);
        }
        onSelectionChange?.(newSet);
    }, [externalSelectedIds, onSelectionChange]);

    const handleSelectAll = () => {
        if (selectedIds.size === data.length && data.length > 0) {
            handleSelectionChange(new Set());
        } else {
            handleSelectionChange(new Set(data.map(d => d.id)));
        }
    };

    const handleSelectRow = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        handleSelectionChange(newSet);
    };
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchData = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            // Parse existing query params from apiEndpoint (if any)
            const [basePath, existingQuery] = apiEndpoint.split('?');
            const params = new URLSearchParams(existingQuery || '');

            // Add/override pagination and search
            params.set('page', page.toString());
            params.set('limit', defaultLimit.toString());
            if (debouncedSearch) params.set('q', debouncedSearch);

            // Add URL filters (for drill-down)
            Object.entries(urlFilters).forEach(([key, value]) => {
                params.set(key, value);
            });

            const result = await apiGet<{ data: any[]; meta: PaginationMeta }>(`${basePath}?${params}`);
            setData(result.data || []);
            setMeta(result.meta || { total: 0, page: 1, limit: defaultLimit, totalPages: 1 });
            // Reset selection on data refresh if internal
            if (!externalSelectedIds) {
                setInternalSelectedIds(new Set());
                onSelectionChange?.(new Set());
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [apiEndpoint, defaultLimit, debouncedSearch, JSON.stringify(urlFilters)]);

    useEffect(() => {
        fetchData(1);
    }, [fetchData]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchData(newPage);
        }
    };

    const handleRowClick = (id: string) => {
        router.push(`/${entitySlug}/${id}`);
    };

    const handleView = (id: string) => {
        router.push(`/${entitySlug}/${id}`);
    };

    const handleEdit = (id: string) => {
        router.push(`/${entitySlug}/${id}?mode=edit`);
    };

    const handleDelete = (id: string) => {
        // TODO: Implement delete confirmation modal
        console.log('Delete:', id);
    };

    // Density-based styling
    const isCompact = density === 'compact';
    const headerCellClass = isCompact ? 'px-3 py-2 text-xs font-semibold text-slate-600 uppercase tracking-wide' : 'px-4 py-3 text-sm font-semibold text-slate-700';
    const bodyCellClass = isCompact ? 'px-3 py-1.5 text-sm' : 'px-4 py-3';
    const rowHeight = isCompact ? 'h-9' : 'h-12';

    const renderCellValue = (row: any, col: ColumnConfig) => {
        const value = col.isCore !== false ? row[col.key] : row.attributes?.[col.key];
        if (col.render) return col.render(value, row);
        if (value === null || value === undefined) return <span className="text-slate-400">-</span>;
        return String(value);
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="flex-none px-4 py-3 bg-white border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        {!hideCreate && (createButton || (
                            <Link href={`/${entitySlug}/new`}>
                                <Button size="sm" className="gap-1">
                                    <Plus className="h-4 w-4" />
                                    新增
                                </Button>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex-none px-4 py-2 bg-white border-b flex items-center gap-4">
                {/* Search */}
                <div className="relative w-72">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        type="text"
                        placeholder={searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 pr-8 h-8 text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Custom filters */}
                {filterComponent}

                {/* Active URL Filter Badge */}
                {hasActiveFilters && (
                    <div className="flex items-center gap-2 border-l pl-4 ml-2">
                        <Badge variant="secondary" className="gap-1 text-blue-700 bg-blue-50">
                            <Filter className="h-3 w-3" />
                            篩選中
                        </Badge>
                        <button
                            onClick={clearFilters}
                            className="text-xs text-slate-500 hover:text-red-600 flex items-center gap-1"
                        >
                            <X className="h-3 w-3" />
                            清除篩選
                        </button>
                    </div>
                )}

                {/* Record count */}
                <div className="ml-auto text-sm text-slate-500">
                    共 {meta.total} 筆資料
                </div>
            </div>

            {/* Table Container - Full Height with Internal Scroll */}
            <div className="flex-1 overflow-hidden px-4 py-2">
                <div className="h-full bg-white rounded-lg border shadow-sm overflow-hidden flex flex-col">
                    {/* Table with sticky header and horizontal scroll */}
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b shadow-sm">
                                <tr>
                                    {/* Actions Column - Sticky Left */}
                                    <th className="sticky left-0 z-20 bg-slate-50 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] px-3 py-2 w-28 text-center">
                                        <span className={headerCellClass}>操作</span>
                                    </th>
                                    {selectable && (
                                        <th className="px-3 py-2 w-10 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                checked={data.length > 0 && selectedIds.size === data.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                    )}
                                    {columns.map((col) => (
                                        <th key={col.key} className={`${headerCellClass} ${col.width || ''}`}>
                                            {col.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={columns.length + (selectable ? 2 : 1) + 1} className="py-12 text-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                                        </td>
                                    </tr>
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length + (selectable ? 2 : 1) + 1} className="py-12 text-center text-slate-500">
                                            查無資料
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`${rowHeight} hover:bg-slate-50 transition-colors ${selectedIds.has(row.id) ? 'bg-blue-50/50' : ''}`}
                                        >
                                            {/* Actions Column - Sticky Left */}
                                            <td className="sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] px-3 py-1.5 text-center">
                                                <RowActions
                                                    rowId={row.id}
                                                    onView={handleView}
                                                    onEdit={handleEdit}
                                                    onDelete={handleDelete}
                                                />
                                            </td>
                                            {selectable && (
                                                <td className="px-3 py-1.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                        checked={selectedIds.has(row.id)}
                                                        onChange={(e) => handleSelectRow(e as any, row.id)}
                                                    />
                                                </td>
                                            )}
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    className={`${bodyCellClass} cursor-pointer`}
                                                    onClick={() => handleRowClick(row.id)}
                                                >
                                                    {renderCellValue(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Fixed at Bottom */}
                    {meta.totalPages > 1 && (
                        <div className="flex-none h-10 px-4 border-t bg-slate-50 flex items-center justify-between text-sm">
                            <button
                                onClick={() => handlePageChange(meta.page - 1)}
                                disabled={meta.page === 1}
                                className="px-3 py-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                上一頁
                            </button>
                            <span className="text-slate-600">
                                第 {meta.page} / {meta.totalPages} 頁
                            </span>
                            <button
                                onClick={() => handlePageChange(meta.page + 1)}
                                disabled={meta.page === meta.totalPages}
                                className="px-3 py-1 rounded text-slate-600 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                下一頁
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
