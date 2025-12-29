"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer, { TableWrapper } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Plus, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface RunawayRecord {
    id: string;
    deployment: {
        worker: { nameZh: string; nameEn?: string };
        employer: { name: string };
    };
    missingDate: string;
    reportDate: string;
    status: string;
    threeDayCountdownStart: string;
    isQuotaFrozen: boolean;
}

const statusMap: Record<string, { label: string; color: string }> = {
    reported_internally: { label: '內部通報 (失聯)', color: 'bg-yellow-100 text-yellow-800' },
    notification_submitted: { label: '已通報主管機關', color: 'bg-orange-100 text-orange-800' },
    confirmed_runaway: { label: '確定逃跑 (名額凍結)', color: 'bg-red-100 text-red-800' },
    found: { label: '已尋獲', color: 'bg-green-100 text-green-800' }
};

export default function RunawayListPage() {
    const router = useRouter();
    const [records, setRecords] = useState<RunawayRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            const res = await fetch('/api/runaways', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const getDaysMissing = (date: string) => {
        const start = new Date(date);
        const now = new Date();
        const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    };

    return (
        <PageContainer title="失聯/逃跑管理 (Runaway Management)">
            <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-2">
                    <input
                        className="border rounded px-3 py-2 bg-white"
                        placeholder="搜尋移工/雇主..."
                    />
                    <Button variant="outline"><Search size={16} /></Button>
                </div>
                <Button onClick={() => router.push('/runaway/new')}>
                    <Plus size={16} className="mr-2" />
                    通報失聯 (Report Missing)
                </Button>
            </div>

            <TableWrapper>
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-slate-600">移工姓名 (Worker)</th>
                            <th className="px-4 py-3 font-medium text-slate-600">雇主 (Employer)</th>
                            <th className="px-4 py-3 font-medium text-slate-600">失聯日期 (Missing Date)</th>
                            <th className="px-4 py-3 font-medium text-slate-600">失聯天數 (Days)</th>
                            <th className="px-4 py-3 font-medium text-slate-600">狀態 (Status)</th>
                            <th className="px-4 py-3 font-medium text-slate-600">名額凍結</th>
                            <th className="px-4 py-3 font-medium text-slate-600">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                        {loading ? (
                            <tr><td colSpan={7} className="p-4 text-center">載入中...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={7} className="p-4 text-center text-slate-400">尚無資料</td></tr>
                        ) : (
                            records.map(record => {
                                const days = getDaysMissing(record.missingDate);
                                const status = statusMap[record.status] || { label: record.status, color: 'bg-gray-100' };
                                const isUrgent = days >= 3 && record.status === 'reported_internally';

                                return (
                                    <tr key={record.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-medium">
                                            <div>{record.deployment.worker.nameZh}</div>
                                            <div className="text-xs text-slate-400">{record.deployment.worker.nameEn}</div>
                                        </td>
                                        <td className="px-4 py-3">{record.deployment.employer.name}</td>
                                        <td className="px-4 py-3">{format(new Date(record.missingDate), 'yyyy/MM/dd')}</td>
                                        <td className="px-4 py-3">
                                            <span className={isUrgent ? 'text-red-600 font-bold' : ''}>
                                                {days} 天
                                            </span>
                                            {isUrgent && <span className="ml-2 text-xs bg-red-100 text-red-600 px-1 rounded">需通報</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {record.isQuotaFrozen ? '🛑 已凍結' : '⭕ 未凍結'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button size="sm" variant="outline" onClick={() => router.push(`/runaway/${record.id}`)}>
                                                查看詳情
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </TableWrapper>
        </PageContainer>
    );
}
