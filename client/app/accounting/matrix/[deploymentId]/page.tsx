'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Unlock, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Link from 'next/link';

interface MatrixData {
    deployment: {
        id: string;
        workerId: string;
        workerName: string;
        employerId: string;
        employerName: string;
        startDate: string;
    };
    columns: Array<{ code: string; name: string }>;
    matrix: Array<{
        period: string;
        items: Record<string, {
            amount: number;
            paidAmount: number;
            status: string;
            receivableId?: string;
        }>;
    }>;
    billingPlan?: {
        id: string;
        status: string;
        reviewStatus: string;
        confirmedAt?: string;
    };
}

const statusColors: Record<string, string> = {
    'PENDING': 'bg-yellow-100 text-yellow-700',
    'PARTIAL': 'bg-blue-100 text-blue-700',
    'PAID': 'bg-green-100 text-green-700',
    'N/A': 'bg-gray-50 text-gray-400',
};

export default function BillingMatrixPage({ params }: { params: { deploymentId: string } }) {
    const [data, setData] = useState<MatrixData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [visibleStart, setVisibleStart] = useState(0);
    const [unlockReason, setUnlockReason] = useState('');
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    const visibleCount = 12; // Show 12 months at a time

    useEffect(() => {
        fetchData();
    }, [params.deploymentId]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/receivables/matrix/${params.deploymentId}`);
            if (res.ok) {
                const matrixData = await res.json();
                setData(matrixData);
            } else {
                const err = await res.json();
                setError(err.error || 'Failed to load data');
            }
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleLock = async () => {
        if (!data?.billingPlan?.id) return;

        try {
            const res = await fetch(`/api/billing-plans/${data.billingPlan.id}/lock`, {
                method: 'POST'
            });
            if (res.ok) {
                await fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to lock');
            }
        } catch (err) {
            alert('Failed to lock');
        }
    };

    const handleUnlock = async () => {
        if (!data?.billingPlan?.id || !unlockReason.trim()) return;

        try {
            const res = await fetch(`/api/billing-plans/${data.billingPlan.id}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: unlockReason })
            });
            if (res.ok) {
                setShowUnlockModal(false);
                setUnlockReason('');
                await fetchData();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to unlock');
            }
        } catch (err) {
            alert('Failed to unlock');
        }
    };

    const visiblePeriods = data?.matrix.slice(visibleStart, visibleStart + visibleCount) || [];
    const isLocked = data?.billingPlan?.status === 'CONFIRMED';

    if (loading) {
        return <div className="p-6 text-center">載入中...</div>;
    }

    if (error || !data) {
        return (
            <div className="p-6 text-center">
                <p className="text-red-500">{error || '無法載入資料'}</p>
                <Link href="/accounting" className="text-blue-500 underline mt-4 inline-block">
                    返回
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-full mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/accounting" className="hover:text-blue-600">會計</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">36期帳務矩陣</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/accounting" className="p-2 hover:bg-slate-100 rounded-lg">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">{data.deployment.workerName}</h1>
                                <p className="text-sm text-gray-500">
                                    {data.deployment.employerName} • 開始日期: {new Date(data.deployment.startDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLocked ? (
                                <>
                                    <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                                        <Lock size={14} /> 已鎖定
                                    </span>
                                    <button
                                        onClick={() => setShowUnlockModal(true)}
                                        className="flex items-center gap-1 px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
                                    >
                                        <Unlock size={14} /> 解鎖
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleLock}
                                    className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                >
                                    <Lock size={14} /> 確認鎖定
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="p-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {/* Pagination controls */}
                    <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
                        <button
                            onClick={() => setVisibleStart(Math.max(0, visibleStart - visibleCount))}
                            disabled={visibleStart === 0}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            <ChevronLeft size={16} /> 前12期
                        </button>
                        <span className="text-sm text-gray-500">
                            顯示第 {visibleStart + 1} - {Math.min(visibleStart + visibleCount, 36)} 期 / 共 36 期
                        </span>
                        <button
                            onClick={() => setVisibleStart(Math.min(24, visibleStart + visibleCount))}
                            disabled={visibleStart >= 24}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                            後12期 <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium sticky left-0 bg-gray-100 z-10">科目 \ 帳期</th>
                                    {visiblePeriods.map(p => (
                                        <th key={p.period} className="px-3 py-2 text-center font-medium min-w-20">
                                            {p.period}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.columns.map(col => (
                                    <tr key={col.code} className="border-t hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium sticky left-0 bg-white z-10 min-w-32">
                                            {col.name}
                                        </td>
                                        {visiblePeriods.map(period => {
                                            const cell = period.items[col.code];
                                            return (
                                                <td key={`${col.code}-${period.period}`} className="px-3 py-2 text-center">
                                                    {cell.status === 'N/A' ? (
                                                        <span className="text-gray-300">-</span>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="font-medium">
                                                                ${cell.amount.toLocaleString()}
                                                            </span>
                                                            {cell.paidAmount > 0 && (
                                                                <span className="text-xs text-green-600">
                                                                    已收 ${cell.paidAmount.toLocaleString()}
                                                                </span>
                                                            )}
                                                            <span className={`px-1.5 py-0.5 text-xs rounded ${statusColors[cell.status]}`}>
                                                                {cell.status === 'PENDING' && '待收'}
                                                                {cell.status === 'PARTIAL' && '部分'}
                                                                {cell.status === 'PAID' && '已收'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">總期數</div>
                        <div className="text-2xl font-bold">36</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">本年度預計</div>
                        <div className="text-2xl font-bold text-blue-600">
                            ${visiblePeriods.reduce((sum, p) =>
                                sum + Object.values(p.items).reduce((s, i) => s + i.amount, 0),
                                0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">已收金額</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${visiblePeriods.reduce((sum, p) =>
                                sum + Object.values(p.items).reduce((s, i) => s + i.paidAmount, 0),
                                0).toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">狀態</div>
                        <div className={`text-lg font-bold ${isLocked ? 'text-green-600' : 'text-orange-500'}`}>
                            {isLocked ? '已確認鎖定' : '待確認'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Unlock Modal */}
            {showUnlockModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">解鎖帳務計畫</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            解鎖後將需要重新確認。請說明解鎖原因：
                        </p>
                        <textarea
                            value={unlockReason}
                            onChange={e => setUnlockReason(e.target.value)}
                            placeholder="請輸入解鎖原因..."
                            className="w-full border rounded px-3 py-2 h-24"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowUnlockModal(false);
                                    setUnlockReason('');
                                }}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={!unlockReason.trim()}
                                className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
                            >
                                確認解鎖
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
