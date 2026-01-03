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
    IN_PROGRESS: { label: '進行中', color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={14} /> },
    COMPLETED: { label: '已完成', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={14} /> },
    BLOCKED: { label: '受阻', color: 'bg-red-100 text-red-800', icon: <XCircle size={14} /> },
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
            title="海外進度追蹤"
            subtitle="追蹤候選人從入境前到體檢進度"
            breadcrumbs={[
                { label: '首頁', href: '/portal' },
                { label: '海外進度追蹤' },
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
                            placeholder="搜尋姓名或護照號碼.."
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
                    <option value="">全部狀態</option>
                    <option value="IN_PROGRESS">進行中</option>
                    <option value="COMPLETED">已完成</option>
                    <option value="BLOCKED">受阻</option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">候選人</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">護照號碼</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">姓名</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">體檢</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">狀態</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">護照號碼</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">居留證</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">狀態</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">姓名</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    載入中..
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                    尚無海外進度記錄
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
                                        <BooleanBadge value={item.passportExpiryOk} trueLabel="合格" falseLabel="不合格" />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <BooleanBadge value={!item.arcHasIssues} trueLabel="有異常" falseLabel="無異常" />
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
                        共 {pagination.total} 筆資料{pagination.page} / {pagination.totalPages} ??
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
        PASS: '合格',
        ISSUED: '已核??,
        FAIL: '不合格',
        REJECTED: '駁回',
        PENDING: '待審',
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
