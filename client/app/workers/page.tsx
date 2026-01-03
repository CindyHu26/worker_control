'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import UniversalListPage, { ColumnConfig } from '@/components/layout/UniversalListPage';
import BatchActionsBar from '@/components/BatchActionsBar';
import BatchDocumentModal from '@/components/BatchDocumentModal';

// Column Configurations
const workerColumns: ColumnConfig[] = [
    {
        key: 'englishName',
        label: '移工',
        width: 'w-72',
        render: (_, row) => (
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-slate-100">
                    <AvatarImage src={row.photoUrl} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-slate-400">
                        <User className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-bold text-slate-900 leading-tight">{row.englishName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.chineseName || '-'}</div>
                    {row.passports?.[0] && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <FileText size={10} />
                            {row.passports[0].passportNumber}
                        </div>
                    )}
                </div>
            </div>
        )
    },
    {
        key: 'nationality',
        label: '國籍',
        width: 'w-24',
        render: (val) => (
            <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-600">
                {val}
            </span>
        )
    },
    {
        key: 'status',
        label: '狀態',
        width: 'w-24',
        render: (_, row) => {
            const isActive = row.deployments?.some((d: any) => d.status === 'active');
            return isActive ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    在職
                </span>
            ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    非在職
                </span>
            );
        }
    },
    {
        key: 'employer',
        label: '雇主',
        render: (_, row) => {
            const activeDeployment = row.deployments?.find((d: any) => d.status === 'active');
            return (
                <span className="text-sm text-slate-700">
                    {activeDeployment?.employer?.companyName || '-'}
                </span>
            );
        }
    }
];

// Quick Filters
const QUICK_FILTERS = [
    { id: 'expiring_30', label: 'Expiring 30 Days', color: 'red' },
    { id: 'arriving_week', label: 'Arriving This Week', color: 'blue' },
    { id: 'missing_docs', label: 'Missing Documents', color: 'amber' },
];

export default function WorkersPage() {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchDocs, setShowBatchDocs] = useState(false);

    // Filter State
    const [activeFilter, setActiveFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // '' | 'active' | 'inactive'

    // Construct API Endpoint with filters
    const queryParams = new URLSearchParams();
    if (activeFilter) queryParams.set('filter', activeFilter);
    if (statusFilter) queryParams.set('status', statusFilter);
    const apiEndpoint = `/api/workers?${queryParams.toString()}`;

    // Batch Action Handlers
    const handleBatchExportCsv = () => {
        alert(`Exporting CSV for ${selectedIds.size} workers...`);
    };

    const handleBatchUpdateStatus = () => {
        alert('Update Status feature coming soon!');
    };

    const handleBatchExportMol = async () => {
        if (selectedIds.size === 0) return;
        try {
            const res = await fetch('http://localhost:3001/api/exports/mol-registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerIds: Array.from(selectedIds) })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = res.headers.get('Content-Disposition');
                let fileName = `mol_labor_list.csv`;
                if (contentDisposition) {
                    const match = contentDisposition.match(/filename="?([^"]+)"?/);
                    if (match && match[1]) fileName = match[1];
                }
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Export failed');
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Export error');
        }
    };

    const FilterComponent = (
        <div className="flex items-center gap-2 border-l pl-4 ml-2">
            {/* Quick Filters */}
            {QUICK_FILTERS.map(f => (
                <button
                    key={f.id}
                    onClick={() => setActiveFilter(activeFilter === f.id ? '' : f.id)}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition border ${activeFilter === f.id
                            ? `bg-${f.color}-50 border-${f.color}-200 text-${f.color}-700`
                            : 'bg-white border-transparent hover:bg-slate-100 text-slate-500'
                        }`}
                >
                    {f.label}
                </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-2" />

            {/* Status Filter */}
            <select
                title="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 text-xs border-slate-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
                <option value="">所有狀態 (All Status)</option>
                <option value="active">在職 (Active)</option>
                <option value="inactive">非在職 (Inactive)</option>
            </select>
        </div>
    );

    return (
        <>
            <UniversalListPage
                title="移工管理"
                subtitle="管理移工資料與文件"
                entitySlug="workers"
                apiEndpoint={apiEndpoint}
                columns={workerColumns}
                density="compact"
                defaultLimit={20}
                selectable={true}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                searchPlaceholder="搜尋姓名、護照、居留證..."
                filterComponent={FilterComponent}
            />

            <BatchActionsBar
                selectedCount={selectedIds.size}
                onClearSelection={() => setSelectedIds(new Set())}
                onGenerateDocuments={() => setShowBatchDocs(true)}
                onExportCsv={handleBatchExportCsv}
                onExportMol={handleBatchExportMol}
                onUpdateStatus={handleBatchUpdateStatus}
            />

            <BatchDocumentModal
                isOpen={showBatchDocs}
                onClose={() => setShowBatchDocs(false)}
                workerIds={Array.from(selectedIds)}
            />
        </>
    );
}
