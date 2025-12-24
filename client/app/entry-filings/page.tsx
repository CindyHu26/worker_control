'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Plane, Search, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';

interface EntryFilingItem {
    id: string;
    workerId: string;
    entryDate: string;
    overallCompliance: string;
    entryReportStatus: string;
    arcStatus: string;
    permitStatus: string;
    initialExamResult: string | null;
    worker: {
        id: string;
        englishName: string;
        chineseName: string | null;
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    PENDING: { label: '待辦理', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    COMPLIANT: { label: '合規', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={14} /> },
    OVERDUE: { label: '逾期', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    WARNING: { label: '即將到期', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle size={14} /> },
    SUBMITTED: { label: '已送件', color: 'bg-blue-100 text-blue-800', icon: <Clock size={14} /> },
};

export default function EntryFilingsPage() {
    const [data, setData] = useState<EntryFilingItem[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dashboard, setDashboard] = useState({ total: 0, compliant: 0, overdue: 0, pending: 0, complianceRate: 0 });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const [listRes, dashRes] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/entry-filings?${params}`, { credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/entry-filings/dashboard`, { credentials: 'include' }),
            ]);

            const listJson = await listRes.json();
            const dashJson = await dashRes.json();

            setData(listJson.data || []);
            setPagination(listJson.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            setDashboard(dashJson);
        } catch (error) {
            console.error('Error fetching entry filings:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search, statusFilter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    return (
        <PageContainer
            title="入國通報管理"
            subtitle="追蹤入境後法定申報事項 (3日/15日期限)"
            breadcrumbs={[
                { label: '首頁', href: '/portal' },
                { label: '入國通報管理' },
            ]}
        >
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">{dashboard.total}</div>
                    <div className="text-sm text-gray-500">總案件數</div>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="text-2xl font-bold text-green-700">{dashboard.compliant}</div>
                    <div className="text-sm text-green-600">合規</div>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <div className="text-2xl font-bold text-red-700">{dashboard.overdue}</div>
                    <div className="text-sm text-red-600">逾期</div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="text-2xl font-bold text-blue-700">{dashboard.complianceRate}%</div>
                    <div className="text-sm text-blue-600">合規率</div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="搜尋移工姓名..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </form>
                <select
                    value={statusFilter}
                    onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">所有狀態</option>
                    <option value="PENDING">待辦理</option>
                    <option value="COMPLIANT">合規</option>
                    <option value="OVERDUE">逾期</option>
                    <option value="WARNING">即將到期</option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">移工</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">入境日期</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">入國通報<br /><span className="text-xs text-gray-400">(3日)</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">入境健檢<br /><span className="text-xs text-gray-400">(3日)</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">居留證<br /><span className="text-xs text-gray-400">(15日)</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">聘僱許可<br /><span className="text-xs text-gray-400">(15日)</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">整體狀態</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">載入中...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">尚無入境申報記錄</td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{item.worker.chineseName || item.worker.englishName}</div>
                                        {item.worker.chineseName && (
                                            <div className="text-xs text-gray-500">{item.worker.englishName}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(item.entryDate).toLocaleDateString('zh-TW')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.entryReportStatus} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.initialExamResult || 'PENDING'} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.arcStatus} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge status={item.permitStatus} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[item.overallCompliance]?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_MAP[item.overallCompliance]?.icon}
                                            {STATUS_MAP[item.overallCompliance]?.label || item.overallCompliance}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/entry-filings/${item.workerId}`}
                                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                        >
                                            編輯
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                        共 {pagination.total} 筆，第 {pagination.page} / {pagination.totalPages} 頁
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page >= pagination.totalPages}
                            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </PageContainer>
    );
}

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_MAP[status];
    if (!config) return <span className="text-gray-400 text-xs">-</span>;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
            {config.icon}
            {config.label}
        </span>
    );
}
