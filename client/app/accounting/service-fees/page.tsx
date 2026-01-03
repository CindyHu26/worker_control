'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowLeft, Calendar, Filter, Download, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

export default function ServiceFeesPage() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(false);
    const [receivables, setReceivables] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0 });
    const [serviceFeeDefIds, setServiceFeeDefIds] = useState<string[]>([]);

    // 1. Fetch Definition IDs for Service Fees
    useEffect(() => {
        fetch('/api/billing-item-definitions?category=SERVICE_FEE')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setServiceFeeDefIds(data.map(d => d.id));
                }
            })
            .catch(err => console.error('Failed to load definitions', err));
    }, []);

    // 2. Fetch Receivables when Month or DefIDs change
    useEffect(() => {
        if (serviceFeeDefIds.length === 0) return;

        setLoading(true);
        const params = new URLSearchParams({
            billingCycles: selectedMonth,
            itemDefinitionIds: serviceFeeDefIds.join(',')
        });

        fetch(`/api/receivables?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setReceivables(data);

                    // Calc stats
                    const total = data.reduce((acc, r) => acc + Number(r.amount), 0);
                    const paid = data.filter(r => r.status === 'PAID').reduce((acc, r) => acc + Number(r.amount), 0);
                    setStats({
                        total,
                        paid,
                        pending: total - paid
                    });
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedMonth, serviceFeeDefIds]);

    const handleMarkPaid = async (id: string, amount: number) => {
        if (!confirm('確定標記為已收款?')) return;
        try {
            const res = await fetch(`/api/receivables/${id}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    paymentDate: new Date().toISOString().slice(0, 10),
                    paymentMethod: 'CASH' // Default for quick action
                })
            });

            if (res.ok) {
                // Refresh
                const updatedReceivables = receivables.map(r =>
                    r.id === id ? { ...r, status: 'PAID', paidAmount: amount, balance: 0 } : r
                );
                setReceivables(updatedReceivables);
            } else {
                alert('儲存失敗');
            }
        } catch (e) {
            console.error(e);
            alert('儲存失敗');
        }
    };

    return (
        <StandardPageLayout title="每月服務費管理 (Service Fees)" showBack onBack={() => window.location.href = '/portal'}>

            {/* Header Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="text-slate-400" size={20} />
                        <span className="font-medium text-slate-700">帳單月份:</span>
                        <input
                            type="month"
                            className="border rounded-md px-3 py-1.5 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                        <Download size={18} />
                        匯出列表
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Plus size={18} />
                        批次產生本月帳單
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">應收總額</div>
                    <div className="text-2xl font-bold text-slate-900">${stats.total.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">已收金額</div>
                    <div className="text-2xl font-bold text-emerald-600">${stats.paid.toLocaleString()}</div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-sm text-slate-500 mb-1">未收餘額</div>
                    <div className="text-2xl font-bold text-red-600">${stats.pending.toLocaleString()}</div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">載入中..</div>
                ) : receivables.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">目前尚無服務費帳單</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-sm font-medium text-slate-500">移工姓名</th>
                                <th className="px-6 py-3 text-sm font-medium text-slate-500">雇主</th>
                                <th className="px-6 py-3 text-sm font-medium text-slate-500">項目</th>
                                
                                <th className="px-6 py-3 text-sm font-medium text-slate-500">狀態</th>
                                
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {receivables.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{r.worker?.englishName}</div>
                                        <div className="text-sm text-slate-500">{r.worker?.chineseName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {r.employer?.companyName}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {r.itemName}
                                    </td>
                                    <td className="px-6 py-4 text-slate-900 font-medium">
                                        ${Number(r.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                            ${r.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200' :
                                                r.status === 'CANCELLED' ? 'bg-slate-50 text-slate-500 border-slate-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-200'}
                                        `}>
                                            {r.status === 'PAID' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                            {r.status === 'PAID' ? '已收款' : r.status === 'PENDING' ? '未收款' : r.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {r.status === 'PENDING' && (
                                            <button
                                                onClick={() => handleMarkPaid(r.id, Number(r.amount))}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                            >
                                                收款
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </StandardPageLayout>
    );
}
