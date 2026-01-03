'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Plane, Search, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

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
    PENDING: { label: 'ÂæÖËæ¶??, color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    COMPLIANT: { label: '?àË?', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={14} /> },
    OVERDUE: { label: '?æÊ?', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
    WARNING: { label: '?≥Â??∞Ê?', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle size={14} /> },
    SUBMITTED: { label: 'Â∑≤ÈÄÅ‰ª∂', color: 'bg-blue-100 text-blue-800', icon: <Clock size={14} /> },
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
        <StandardPageLayout
            title="?•Â??öÂ†±ÁÆ°Á?"
            subtitle="ËøΩËπ§?•Â?ÂæåÊ?ÂÆöÁî≥?±‰???(3??15?•Ê???"
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/portal' },
                { label: '?•Â??öÂ†±ÁÆ°Á?' },
            ]}
        >
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">{dashboard.total}</div>
                    <div className="text-sm text-gray-500">Á∏ΩÊ?‰ª∂Êï∏</div>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="text-2xl font-bold text-green-700">{dashboard.compliant}</div>
                    <div className="text-sm text-green-600">?àË?</div>
                </div>
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                    <div className="text-2xl font-bold text-red-700">{dashboard.overdue}</div>
                    <div className="text-sm text-red-600">?æÊ?</div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="text-2xl font-bold text-blue-700">{dashboard.complianceRate}%</div>
                    <div className="text-sm text-blue-600">?àË???/div>
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
                            placeholder="?úÂ?ÁßªÂ∑•ÂßìÂ?..."
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
                    <option value="">?Ä?âÁ???/option>
                    <option value="PENDING">ÂæÖËæ¶??/option>
                    <option value="COMPLIANT">?àË?</option>
                    <option value="OVERDUE">?æÊ?</option>
                    <option value="WARNING">?≥Â??∞Ê?</option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">ÁßªÂ∑•</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">?•Â??•Ê?</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?•Â??öÂ†±<br /><span className="text-xs text-gray-400">(3??</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?•Â??•Ê™¢<br /><span className="text-xs text-gray-400">(3??</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Â±ÖÁ?Ë≠?br /><span className="text-xs text-gray-400">(15??</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?òÂÉ±Ë®±ÂèØ<br /><span className="text-xs text-gray-400">(15??</span></th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?¥È??Ä??/th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?ç‰?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">ËºâÂÖ•‰∏?..</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Â∞öÁÑ°?•Â??≥Â†±Ë®òÈ?</td>
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
                                            Á∑®ËºØ
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
                        ??{pagination.total} Á≠ÜÔ?Á¨?{pagination.page} / {pagination.totalPages} ??
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
        </StandardPageLayout>
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
