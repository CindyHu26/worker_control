
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchToolbar from '@/components/SearchToolbar';
import BatchActionsBar from '@/components/BatchActionsBar';
import BatchDocumentModal from '@/components/BatchDocumentModal';

interface Worker {
    id: string;
    englishName: string;
    chineseName?: string;
    nationality: string;
    deployments: { status: string; employer: { companyName: string } }[];
    passports: { passportNumber: string }[];
}

export default function WorkersPage() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBatchDocs, setShowBatchDocs] = useState(false);

    // Search Params State
    const [searchParams, setSearchParams] = useState({ q: '', status: '', nationality: '', filter: '' });

    const fetchWorkers = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                q: searchParams.q,
                status: searchParams.status,
                nationality: searchParams.nationality
            });
            if (searchParams.filter) query.append('filter', searchParams.filter);

            if (searchParams.filter) query.append('filter', searchParams.filter);

            const res = await fetch(`http://localhost:3001/api/workers?${query}`, {
                credentials: 'include'
            });
            if (res.ok) {
                const { data, meta } = await res.json();
                setWorkers(data);
                setMeta(meta);
                setSelectedIds(new Set());
            }
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when search params change (reset to page 1)
    useEffect(() => {
        fetchWorkers(1);
    }, [searchParams]);

    const handleSearch = (params: any) => {
        setSearchParams(prev => ({ ...prev, ...params }));
    };

    const handleFilterPreset = (preset: string) => {
        setSearchParams(prev => ({ ...prev, filter: prev.filter === preset ? '' : preset }));
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchWorkers(newPage);
        }
    };

    // Selection Handlers
    const toggleSelectAll = () => {
        if (selectedIds.size === workers.length && workers.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(workers.map(w => w.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBatchExportCsv = () => {
        // Placeholder implementation
        alert(`Exporting CSV for ${selectedIds.size} workers...`);
    };

    const handleBatchUpdateStatus = () => {
        // Placeholder implementation
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
                // Filename should come from header usually, but fallback here
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

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500 pb-24">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">移工管理</h1>
                    <p className="text-slate-500 mt-2">管理移工資料與文件</p>
                </div>
                <Link
                    href="/workers/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>新增移工</span>
                </Link>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-semibold text-slate-500 mr-2">Quick Filters:</span>
                <button
                    onClick={() => handleFilterPreset('expiring_30')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                        ${searchParams.filter === 'expiring_30' ? 'bg-red-50 border-red-200 text-red-600 ring-1 ring-red-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                    `}
                >
                    Expiring in 30 Days
                </button>
                <button
                    onClick={() => handleFilterPreset('arriving_week')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                        ${searchParams.filter === 'arriving_week' ? 'bg-blue-50 border-blue-200 text-blue-600 ring-1 ring-blue-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                    `}
                >
                    Arriving This Week
                </button>
                <button
                    onClick={() => handleFilterPreset('missing_docs')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition
                        ${searchParams.filter === 'missing_docs' ? 'bg-amber-50 border-amber-200 text-amber-600 ring-1 ring-amber-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}
                    `}
                >
                    Missing Documents
                </button>
            </div>

            {/* Search Toolbar */}
            <SearchToolbar
                onSearch={handleSearch}
                placeholder="搜尋姓名、護照、居留證..."
                showNationality={true}
                nationalityOptions={[
                    { label: '印尼 (Indonesia)', value: 'Indonesia' },
                    { label: '越南 (Vietnam)', value: 'Vietnam' },
                    { label: '菲律賓 (Philippines)', value: 'Philippines' },
                    { label: '泰國 (Thailand)', value: 'Thailand' }
                ]}
                statusOptions={[
                    { label: '在職 (Active)', value: 'active' },
                    { label: '非在職 (Inactive)', value: 'inactive' }
                ]}
            />

            {/* Results Info */}
            {!loading && (
                <p className="text-sm text-slate-500 mb-4 ml-1">
                    共找到 {meta.total} 筆資料
                </p>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">未找到移工資料</h3>
                    <p className="text-slate-500 mt-1">請嘗試調整篩選條件或搜尋關鍵字。</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={workers.length > 0 && selectedIds.size === workers.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">移工</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">國籍</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">目前狀態</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">雇主</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workers.map((worker) => {
                                const activeDeployment = worker.deployments[0]; // We filtered for active
                                const hasActiveDeployment = !!activeDeployment;
                                const isSelected = selectedIds.has(worker.id);

                                return (
                                    <tr
                                        key={worker.id}
                                        className={`hover:bg-slate-50 transition duration-150 ${isSelected ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={isSelected}
                                                onChange={() => toggleSelect(worker.id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-slate-900">{worker.englishName}</div>
                                                <div className="text-sm text-slate-500">{worker.chineseName || '-'}</div>
                                                {worker.passports?.[0] && (
                                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <FileText size={10} />
                                                        {worker.passports[0].passportNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-sm font-medium">
                                                {worker.nationality}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {hasActiveDeployment ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    在職
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    非在職
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {activeDeployment?.employer?.companyName || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/workers/${worker.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                            >
                                                查看詳情
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <button
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page === 1}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition
                                ${meta.page === 1
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-300'
                                }
                            `}
                        >
                            <ChevronLeft size={16} />
                            上一頁
                        </button>

                        <span className="text-sm text-slate-600 font-medium">
                            第 {meta.page} 頁 / 共 {meta.totalPages} 頁
                        </span>

                        <button
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page === meta.totalPages}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition
                                ${meta.page === meta.totalPages
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-300'
                                }
                            `}
                        >
                            下一頁
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )
            }

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
        </div >
    );
}
