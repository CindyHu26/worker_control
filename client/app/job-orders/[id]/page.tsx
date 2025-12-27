'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2, Plus, Users, Building2, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';

interface JobOrder {
    id: string;
    title: string;
    description?: string;
    requiredCount: number;
    filledCount: number;
    skillRequirements?: string;
    workLocation?: string;
    jobType?: string;
    nationalityPreference?: string;
    genderPreference?: string;
    status: string;
    orderDate: string;
    employer: {
        id: string;
        companyName: string;
        totalQuota: number;
    };
    quotaInfo?: {
        hasQuota: boolean;
        remainingQuota: number;
        message: string;
    };
    interviews: Array<{
        id: string;
        interviewDate: string;
        interviewerName?: string;
        result: string;
        notes?: string;
        candidate?: {
            id: string;
            nameZh: string;
            nameEn?: string;
            passportNo: string;
            nationality: string;
        };
    }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
    OPEN: { label: '招募中', color: 'bg-green-100 text-green-800' },
    SOURCING: { label: '選工中', color: 'bg-blue-100 text-blue-800' },
    PARTIAL: { label: '部分錄取', color: 'bg-yellow-100 text-yellow-800' },
    FILLED: { label: '額滿', color: 'bg-purple-100 text-purple-800' },
    COMPLETED: { label: '已完成', color: 'bg-slate-100 text-slate-800' },
    CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-800' },
};

const resultLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: '待定', color: 'bg-slate-100 text-slate-700' },
    SELECTED: { label: '正取', color: 'bg-green-100 text-green-800' },
    WAITLIST: { label: '備取', color: 'bg-yellow-100 text-yellow-800' },
    REJECTED: { label: '不錄用', color: 'bg-red-100 text-red-800' },
};

const nationalityLabels: Record<string, string> = {
    VN: '越南',
    PH: '菲律賓',
    ID: '印尼',
    TH: '泰國',
};

const genderLabels: Record<string, string> = {
    male: '男性',
    female: '女性',
    MALE: '男性',
    FEMALE: '女性',
};

export default function JobOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const id = params.id as string;

    useEffect(() => {
        if (id) {
            fetchJobOrder();
        }
    }, [id]);

    const fetchJobOrder = async () => {
        try {
            const res = await fetch(`/api/job-orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setJobOrder(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('確定要刪除此招募訂單？')) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/job-orders/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/job-orders');
            } else {
                alert('刪除失敗');
            }
        } catch (e) {
            console.error(e);
            alert('發生錯誤');
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <PageContainer title="載入中...">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            </PageContainer>
        );
    }

    if (!jobOrder) {
        return (
            <PageContainer title="找不到招募訂單">
                <div className="text-center py-20 text-slate-500">
                    招募訂單不存在或已刪除
                </div>
            </PageContainer>
        );
    }

    const status = statusLabels[jobOrder.status] || { label: jobOrder.status, color: 'bg-slate-100 text-slate-700' };

    return (
        <PageContainer
            title={jobOrder.title}
            subtitle={`訂單詳情 (Job Order #${id.slice(0, 8)})`}
            breadcrumbs={[
                { label: '招募訂單', href: '/job-orders' },
                { label: jobOrder.title },
            ]}
            actions={
                <div className="flex gap-2">
                    <Link href={`/job-orders/${id}/edit`}>
                        <Button variant="outline" className="gap-2">
                            <Edit size={16} />
                            編輯
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="gap-2 text-red-600 hover:bg-red-50"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <Trash2 size={16} />
                        刪除
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Status & Quota Alert */}
                <div className="flex flex-wrap gap-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                        {status.label}
                    </span>
                    {jobOrder.quotaInfo && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${jobOrder.quotaInfo.hasQuota ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                            {jobOrder.quotaInfo.hasQuota ? (
                                <CheckCircle2 className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            {jobOrder.quotaInfo.message}
                        </div>
                    )}
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <Building2 className="h-4 w-4" />
                            雇主
                        </div>
                        <div className="font-medium text-lg">{jobOrder.employer.companyName}</div>
                    </div>

                    <div className="bg-white rounded-lg border p-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                            <Users className="h-4 w-4" />
                            需求 / 已錄取
                        </div>
                        <div className="font-medium text-lg">
                            {jobOrder.filledCount} / {jobOrder.requiredCount} 人
                        </div>
                    </div>

                    {jobOrder.workLocation && (
                        <div className="bg-white rounded-lg border p-4">
                            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                                <MapPin className="h-4 w-4" />
                                工作地點
                            </div>
                            <div className="font-medium">{jobOrder.workLocation}</div>
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4">詳細資訊</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {jobOrder.jobType && (
                            <div>
                                <span className="text-slate-500">工種：</span>
                                <span className="font-medium ml-2">{jobOrder.jobType}</span>
                            </div>
                        )}
                        {jobOrder.nationalityPreference && (
                            <div>
                                <span className="text-slate-500">國籍偏好：</span>
                                <span className="font-medium ml-2">{nationalityLabels[jobOrder.nationalityPreference] || jobOrder.nationalityPreference}</span>
                            </div>
                        )}
                        {jobOrder.genderPreference && (
                            <div>
                                <span className="text-slate-500">性別偏好：</span>
                                <span className="font-medium ml-2">{genderLabels[jobOrder.genderPreference] || jobOrder.genderPreference}</span>
                            </div>
                        )}
                        <div>
                            <span className="text-slate-500">建立日期：</span>
                            <span className="font-medium ml-2">{new Date(jobOrder.orderDate).toLocaleDateString('zh-TW')}</span>
                        </div>
                    </div>

                    {jobOrder.skillRequirements && (
                        <div className="mt-4">
                            <span className="text-slate-500 text-sm">技能要求：</span>
                            <p className="mt-1 text-slate-700">{jobOrder.skillRequirements}</p>
                        </div>
                    )}
                    {jobOrder.description && (
                        <div className="mt-4">
                            <span className="text-slate-500 text-sm">職位說明：</span>
                            <p className="mt-1 text-slate-700">{jobOrder.description}</p>
                        </div>
                    )}
                </div>

                {/* Interviews Section */}
                <div className="bg-white rounded-lg border">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">面試記錄 ({jobOrder.interviews.length})</h3>
                        <Button className="gap-2" size="sm">
                            <Plus size={16} />
                            新增面試
                        </Button>
                    </div>

                    {jobOrder.interviews.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            尚無面試記錄
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">候選人</th>
                                        <th className="px-4 py-3 text-left">護照號碼</th>
                                        <th className="px-4 py-3 text-left">國籍</th>
                                        <th className="px-4 py-3 text-left">面試日期</th>
                                        <th className="px-4 py-3 text-left">結果</th>
                                        <th className="px-4 py-3 text-left">備註</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {jobOrder.interviews.map(inv => {
                                        const result = resultLabels[inv.result] || { label: inv.result, color: 'bg-slate-100' };
                                        return (
                                            <tr key={inv.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-medium">
                                                    {inv.candidate?.nameZh || '-'}
                                                    {inv.candidate?.nameEn && (
                                                        <span className="text-slate-400 ml-1">({inv.candidate.nameEn})</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs">{inv.candidate?.passportNo || '-'}</td>
                                                <td className="px-4 py-3">{nationalityLabels[inv.candidate?.nationality || ''] || inv.candidate?.nationality || '-'}</td>
                                                <td className="px-4 py-3">{new Date(inv.interviewDate).toLocaleDateString('zh-TW')}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${result.color}`}>
                                                        {result.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">{inv.notes || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </PageContainer>
    );
}
