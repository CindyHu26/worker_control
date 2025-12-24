'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Briefcase } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';

interface JobOrder {
    id: string;
    title: string;
    employer: {
        companyName: string;
    };
    status: string;
    requiredCount: number;
    _count: {
        interviews: number;
    };
    createdAt: string;
}

const statusLabels: Record<string, string> = {
    OPEN: '招募中',
    CLOSED: '已結案',
    CANCELLED: '已取消',
};

export default function JobOrderListPage() {
    const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('OPEN');

    useEffect(() => {
        fetchJobOrders();
    }, [statusFilter]);

    const fetchJobOrders = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const res = await fetch(`/api/job-orders?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setJobOrders(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer
            title="招募訂單管理"
            subtitle="職缺媒合與面試追蹤 (Job Order & Interview Management)"
            actions={
                <Link href="/job-orders/new">
                    <Button className="gap-2">
                        <Plus size={16} />
                        新增招募訂單
                    </Button>
                </Link>
            }
        >
            {/* Status Filter */}
            <div className="mb-4 flex gap-3">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                >
                    <option value="">全部狀態</option>
                    <option value="OPEN">招募中</option>
                    <option value="CLOSED">已結案</option>
                    <option value="CANCELLED">已取消</option>
                </select>
            </div>

            {/* Table Wrapper */}
            <div className="w-full overflow-x-auto rounded-md border bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">職位名稱</th>
                            <th className="px-6 py-3">雇主</th>
                            <th className="px-6 py-3">需求人數</th>
                            <th className="px-6 py-3">面試人數</th>
                            <th className="px-6 py-3">狀態</th>
                            <th className="px-6 py-3">建立日期</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {jobOrders.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    尚無招募訂單
                                </td>
                            </tr>
                        )}
                        {jobOrders.map((job) => (
                            <tr key={job.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium">{job.title}</td>
                                <td className="px-6 py-3">{job.employer?.companyName || '-'}</td>
                                <td className="px-6 py-3 text-center">{job.requiredCount}</td>
                                <td className="px-6 py-3 text-center">{job._count?.interviews || 0}</td>
                                <td className="px-6 py-3">
                                    <span
                                        className={`inline-block px-2 py-1 text-xs rounded-full ${job.status === 'OPEN'
                                            ? 'bg-green-100 text-green-800'
                                            : job.status === 'CLOSED'
                                                ? 'bg-slate-100 text-slate-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {statusLabels[job.status] || job.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">
                                    {new Date(job.createdAt).toLocaleDateString('zh-TW')}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Link
                                        href={`/job-orders/${job.id}`}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        檢視
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageContainer>
    );
}
