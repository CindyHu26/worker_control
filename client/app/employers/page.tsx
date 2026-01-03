"use client";

import React, { useState } from 'react';
import UniversalListPage, { ColumnConfig } from '@/components/layout/UniversalListPage';
import RelationLink from '@/components/data-table/RelationLink';

// Column definitions for Employers table
const employerColumns: ColumnConfig[] = [
    { key: 'code', label: '雇主編號', width: 'w-28' },
    {
        key: 'companyName',
        label: '雇主名稱',
        render: (value, row) => (
            <div className="font-semibold text-slate-900">{value || row.responsiblePerson}</div>
        )
    },
    { key: 'taxId', label: '統一編號', width: 'w-32' },
    { key: 'responsiblePerson', label: '負責人', width: 'w-24' },
    {
        key: '_count.deployments',
        label: '在職工人',
        width: 'w-24',
        render: (_, row) => (
            <RelationLink
                count={row._count?.deployments || 0}
                targetEntity="workers"
                filterKey="employerId"
                filterValue={row.id}
                icon="users"
                label="查看在職移工"
            />
        )
    },
    {
        key: '_count.recruitmentLetters',
        label: '招募函',
        width: 'w-20',
        render: (_, row) => (
            <RelationLink
                count={row._count?.recruitmentLetters || 0}
                targetEntity="recruitment/job-orders"
                filterKey="employerId"
                filterValue={row.id}
                icon="document"
                label="查看招募函"
            />
        )
    },
];

// Category filter tabs
const CATEGORIES = [
    { value: 'ALL', label: '全部 (All)' },
    { value: 'MANUFACTURING', label: '製造業 (Manufacturing)' },
    { value: 'HOME_CARE', label: '家庭看護 (Home Care)' },
    { value: 'INSTITUTION', label: '養護機構 (Institution)' },
];

export default function EmployersPage() {
    const [activeCategory, setActiveCategory] = useState('ALL');

    // Build API endpoint with category filter
    const apiEndpoint = activeCategory === 'ALL'
        ? '/api/employers'
        : `/api/employers?category=${activeCategory}`;

    return (
        <UniversalListPage
            title="雇主資料管理"
            subtitle="管理雇主檔案與需求"
            entitySlug="employers"
            apiEndpoint={apiEndpoint}
            columns={employerColumns}
            density="compact"
            searchPlaceholder="搜尋公司名稱、統編、負責人..."
            filterComponent={
                <div className="flex gap-1 border-l pl-4 ml-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setActiveCategory(cat.value)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition ${activeCategory === cat.value
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            }
        />
    );
}
