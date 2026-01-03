'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plane, Search, ChevronLeft, ChevronRight,
    CheckCircle2, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface OverseasProgressItem {
    id: string;
    candidateId: string;
    overallStatus: string;
    medicalExamResult: string | null;
    policeClrStatus: string | null;
    passportExpiryOk: boolean;
    arcHasIssues: boolean;
    updatedAt: string;
    candidate: {
        id: string;
        nameZh: string;
        nameEn: string | null;
        passportNo: string;
        nationality: string;
    };
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    IN_PROGRESS: { label: '?≤Ë?‰∏?, color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    COMPLETED: { label: 'Â∑≤Â???, color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={14} /> },
    BLOCKED: { label: '?âÈòª??, color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
};

export default function OverseasProgressPage() {
    const router = useRouter();
    const [data, setData] = useState<OverseasProgressItem[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overseas-progress?${params}`, {
                credentials: 'include',
            });
            const json = await res.json();
            setData(json.data || []);
            setPagination(json.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Error fetching overseas progress:', error);
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
            title="Êµ∑Â??≤Â∫¶ËøΩËπ§"
            subtitle="ËøΩËπ§?ôÈÅ∏‰∫∫Â??àÂ??≥ÂÖ•Â¢ÉÂ??ÑÂ??ÖÊ™¢?∏È??≤Â∫¶"
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/portal' },
                { label: 'Êµ∑Â??≤Â∫¶ËøΩËπ§' },
            ]}
        >
            {/* Filters */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="?úÂ?ÂßìÂ??ÅË≠∑?ßË?Á¢?.."
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
                    <option value="IN_PROGRESS">?≤Ë?‰∏?/option>
                    <option value="COMPLETED">Â∑≤Â???/option>
                    <option value="BLOCKED">?âÈòª??/option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">?ôÈÅ∏‰∫?/th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Ë≠∑ÁÖß?üÁ¢º</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">?ãÁ?</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">È´îÊ™¢</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?ØÊ?Ë≠?/th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Ë≠∑ÁÖß?àÊ?</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?äARC</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?¥È??Ä??/th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?ç‰?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    ËºâÂÖ•‰∏?..
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    Â∞öÁÑ°Êµ∑Â??≤Â∫¶Ë®òÈ?
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{item.candidate.nameZh}</div>
                                        {item.candidate.nameEn && (
                                            <div className="text-xs text-gray-500">{item.candidate.nameEn}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">{item.candidate.passportNo}</td>
                                    <td className="px-4 py-3 text-gray-600">{item.candidate.nationality}</td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge value={item.medicalExamResult} type="medical" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge value={item.policeClrStatus} type="police" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <BooleanBadge value={item.passportExpiryOk} trueLabel="?àÊ†º" falseLabel="‰∏çÂ??? />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <BooleanBadge value={!item.arcHasIssues} trueLabel="?°Â?È°? falseLabel="?âÂ?È°? />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_MAP[item.overallStatus]?.color || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_MAP[item.overallStatus]?.icon}
                                            {STATUS_MAP[item.overallStatus]?.label || item.overallStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/overseas-progress/${item.candidateId}`}
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

function StatusBadge({ value, type }: { value: string | null; type: 'medical' | 'police' }) {
    if (!value) return <span className="text-gray-400 text-xs">-</span>;

    const colors: Record<string, string> = {
        PASS: 'bg-green-100 text-green-700',
        ISSUED: 'bg-green-100 text-green-700',
        FAIL: 'bg-red-100 text-red-700',
        REJECTED: 'bg-red-100 text-red-700',
        PENDING: 'bg-yellow-100 text-yellow-700',
    };

    const labels: Record<string, string> = {
        PASS: '?àÊ†º',
        ISSUED: 'Â∑≤Ê†∏??,
        FAIL: '‰∏çÂ???,
        REJECTED: 'ÈßÅÂ?',
        PENDING: 'ÂæÖÂØ©',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[value] || 'bg-gray-100'}`}>
            {labels[value] || value}
        </span>
    );
}

function BooleanBadge({ value, trueLabel, falseLabel }: { value: boolean; trueLabel: string; falseLabel: string }) {
    return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {value ? trueLabel : falseLabel}
        </span>
    );
}
