'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
    Stethoscope, Search, ChevronLeft, ChevronRight,
    AlertTriangle, CheckCircle2, Clock, Phone
} from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface MedicalExceptionItem {
    id: string;
    workerId: string;
    diagnosisDate: string;
    diseaseType: string;
    treatmentStatus: string;
    healthDeptNotified: boolean;
    employerNotified: boolean;
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

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'ÂæÖË???, color: 'bg-yellow-100 text-yellow-800' },
    IN_TREATMENT: { label: 'Ê≤ªÁ?‰∏?, color: 'bg-blue-100 text-blue-800' },
    RECOVERED: { label: 'Â∑≤Á???, color: 'bg-green-100 text-green-800' },
    DEPORTED: { label: 'Â∑≤ÈÅ£Ëø?, color: 'bg-gray-100 text-gray-800' },
};

const DISEASE_LABELS: Record<string, string> = {
    TB: '?∫Á???,
    AMOEBIASIS: '?øÁ±≥Â∑¥Áó¢??,
    SYPHILIS: 'Ê¢ÖÊ?',
    HIV: 'HIV/?õÊ???,
    HEPATITIS_B: 'B?ãË???,
    OTHER: '?∂‰?',
};

export default function MedicalExceptionsPage() {
    const [data, setData] = useState<MedicalExceptionItem[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dashboard, setDashboard] = useState({ total: 0, pending: 0, inTreatment: 0, recovered: 0, deported: 0 });

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
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/medical-exceptions?${params}`, { credentials: 'include' }),
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/medical-exceptions/dashboard`, { credentials: 'include' }),
            ]);

            const listJson = await listRes.json();
            const dashJson = await dashRes.json();

            setData(listJson.data || []);
            setPagination(listJson.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
            setDashboard(dashJson);
        } catch (error) {
            console.error('Error fetching medical exceptions:', error);
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

    const handleNotify = async (id: string, type: 'health-dept' | 'employer') => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/medical-exceptions/${id}/notify-${type}`, {
                method: 'POST',
                credentials: 'include',
            });
            fetchData();
        } catch (error) {
            console.error('Error notifying:', error);
        }
    };

    return (
        <StandardPageLayout
            title="Ë°õÊîø?öÂ†±ÁÆ°Á?"
            subtitle="Ê≥ïÂ??≥Ê??ÖÁï∞Â∏∏ÈÄöÂ†±?áË??ÜËøΩËπ?
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/portal' },
                { label: 'Ë°õÊîø?öÂ†±ÁÆ°Á?' },
            ]}
            actions={
                <Link
                    href="/medical-exceptions/new"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                    <AlertTriangle size={16} />
                    ?∞Â??öÂ†±
                </Link>
            }
        >
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">{dashboard.total}</div>
                    <div className="text-sm text-gray-500">Á∏ΩÈÄöÂ†±??/div>
                </div>
                <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                    <div className="text-2xl font-bold text-yellow-700">{dashboard.pending}</div>
                    <div className="text-sm text-yellow-600">ÂæÖË???/div>
                </div>
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
                    <div className="text-2xl font-bold text-blue-700">{dashboard.inTreatment}</div>
                    <div className="text-sm text-blue-600">Ê≤ªÁ?‰∏?/div>
                </div>
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                    <div className="text-2xl font-bold text-green-700">{dashboard.recovered}</div>
                    <div className="text-sm text-green-600">Â∑≤Á???/div>
                </div>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-700">{dashboard.deported}</div>
                    <div className="text-sm text-gray-600">Â∑≤ÈÅ£Ëø?/div>
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
                    <option value="PENDING">ÂæÖË???/option>
                    <option value="IN_TREATMENT">Ê≤ªÁ?‰∏?/option>
                    <option value="RECOVERED">Â∑≤Á???/option>
                    <option value="DEPORTED">Â∑≤ÈÅ£Ëø?/option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">ÁßªÂ∑•</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">Á¢∫Ë®∫?•Ê?</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-700">?æÁ?È°ûÂ?</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">Ë°õÁ?Â±Ä?öÂ†±</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?á‰∏ª?öÁü•</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?ïÁ??Ä??/th>
                            <th className="px-4 py-3 text-center font-medium text-gray-700">?ç‰?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">ËºâÂÖ•‰∏?..</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Â∞öÁÑ°?∞Â∏∏?öÂ†±Ë®òÈ?</td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{item.worker.chineseName || item.worker.englishName}</div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {new Date(item.diagnosisDate).toLocaleDateString('zh-TW')}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                                            {DISEASE_LABELS[item.diseaseType] || item.diseaseType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.healthDeptNotified ? (
                                            <CheckCircle2 className="inline text-green-600" size={18} />
                                        ) : (
                                            <button
                                                onClick={() => handleNotify(item.id, 'health-dept')}
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                Ê®ôË?Â∑≤ÈÄöÂ†±
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.employerNotified ? (
                                            <CheckCircle2 className="inline text-green-600" size={18} />
                                        ) : (
                                            <button
                                                onClick={() => handleNotify(item.id, 'employer')}
                                                className="text-blue-600 hover:underline text-xs"
                                            >
                                                Ê®ôË?Â∑≤ÈÄöÁü•
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_MAP[item.treatmentStatus]?.color || 'bg-gray-100'}`}>
                                            {STATUS_MAP[item.treatmentStatus]?.label || item.treatmentStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/medical-exceptions/${item.id}`}
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
