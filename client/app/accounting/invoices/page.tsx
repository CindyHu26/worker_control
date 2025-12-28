'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, ArrowLeft, Download, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
    id: string;
    invoiceNo: string;
    payerType: string;
    payerId: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    status: string;
    items: Array<{
        id: string;
        amount: number;
        receivable: {
            worker?: { englishName: string };
            employer?: { companyName: string };
            billingCycle: string;
            itemName: string;
        };
    }>;
}

interface Receivable {
    id: string;
    itemName: string;
    billingCycle: string;
    amount: number;
    balance: number;
    worker?: { englishName: string };
    employer?: { companyName: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: '草稿', color: 'bg-gray-100 text-gray-600' },
    ISSUED: { label: '已發出', color: 'bg-blue-100 text-blue-700' },
    PAID: { label: '已結清', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '已取消', color: 'bg-red-100 text-red-600' },
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    // Create form state
    const [payerType, setPayerType] = useState<'EMPLOYER' | 'WORKER'>('EMPLOYER');
    const [payerId, setPayerId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [selectedReceivables, setSelectedReceivables] = useState<string[]>([]);
    const [availableReceivables, setAvailableReceivables] = useState<Receivable[]>([]);
    const [employers, setEmployers] = useState<Array<{ id: string; companyName: string }>>([]);
    const [workers, setWorkers] = useState<Array<{ id: string; englishName: string }>>([]);
    const [creating, setCreating] = useState(false);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices');
            if (res.ok) {
                const data = await res.json();
                setInvoices(data);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        // Load employers and workers
        Promise.all([
            fetch('/api/employers').then(r => r.json()),
            fetch('/api/workers').then(r => r.json()),
        ]).then(([emp, wkr]) => {
            setEmployers(Array.isArray(emp) ? emp : []);
            setWorkers(Array.isArray(wkr) ? wkr : []);
        });
    }, []);

    const loadReceivables = async () => {
        if (!payerId) return;

        const params = new URLSearchParams();
        params.append('status', 'PENDING,PARTIAL');
        if (payerType === 'EMPLOYER') {
            params.append('employerIds', payerId);
        } else {
            params.append('workerIds', payerId);
        }

        try {
            const res = await fetch(`/api/receivables?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setAvailableReceivables(data);
            }
        } catch (error) {
            console.error('Failed to load receivables:', error);
        }
    };

    useEffect(() => {
        if (payerId) {
            loadReceivables();
        } else {
            setAvailableReceivables([]);
        }
    }, [payerId, payerType]);

    const handleCreate = async () => {
        if (!payerId || !dueDate || selectedReceivables.length === 0) {
            alert('請填寫所有必填欄位');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payerType,
                    payerId,
                    dueDate,
                    receivableIds: selectedReceivables,
                }),
            });

            if (res.ok) {
                await fetchInvoices();
                setShowCreateModal(false);
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || '建立失敗');
            }
        } catch (error) {
            console.error('Failed to create:', error);
            alert('建立失敗');
        } finally {
            setCreating(false);
        }
    };

    const resetForm = () => {
        setPayerType('EMPLOYER');
        setPayerId('');
        setDueDate('');
        setSelectedReceivables([]);
        setAvailableReceivables([]);
    };

    const downloadExcel = async (id: string, invoiceNo: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}/excel`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${invoiceNo}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Download failed:', error);
            alert('下載失敗');
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                await fetchInvoices();
                setSelectedInvoice(null);
            }
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/portal" className="hover:text-blue-600 transition-colors">功能導覽</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">請款單管理</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/portal" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft size={20} className="text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <ClipboardList className="text-amber-600" size={24} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900">請款單管理</h1>
                                    <p className="text-sm text-slate-500">Invoice Management</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            <Plus size={18} />
                            建立請款單
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="text-center py-8">載入中...</div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">請款單號</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">付款人</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">開立日</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">到期日</th>
                                    <th className="px-4 py-3 text-right text-sm font-medium">金額</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">狀態</th>
                                    <th className="px-4 py-3 text-center text-sm font-medium">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {invoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 font-mono text-sm">{inv.invoiceNo}</td>
                                        <td className="px-4 py-3 text-sm">
                                            {inv.payerType === 'EMPLOYER' ? '雇主' : '員工'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {new Date(inv.issueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {new Date(inv.dueDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            ${Number(inv.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 text-xs rounded ${statusLabels[inv.status]?.color}`}>
                                                {statusLabels[inv.status]?.label || inv.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                                    title="檢視"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => downloadExcel(inv.id, inv.invoiceNo)}
                                                    className="p-1 text-green-500 hover:bg-green-50 rounded"
                                                    title="下載 Excel"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            尚無請款單
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">建立請款單</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">付款人類型 *</label>
                                    <select
                                        value={payerType}
                                        onChange={e => {
                                            setPayerType(e.target.value as 'EMPLOYER' | 'WORKER');
                                            setPayerId('');
                                        }}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="EMPLOYER">雇主</option>
                                        <option value="WORKER">員工</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        選擇{payerType === 'EMPLOYER' ? '雇主' : '員工'} *
                                    </label>
                                    <select
                                        value={payerId}
                                        onChange={e => setPayerId(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                    >
                                        <option value="">請選擇</option>
                                        {payerType === 'EMPLOYER'
                                            ? employers.map(e => <option key={e.id} value={e.id}>{e.companyName}</option>)
                                            : workers.map(w => <option key={w.id} value={w.id}>{w.englishName}</option>)
                                        }
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">到期日 *</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="w-full border rounded px-3 py-2"
                                    />
                                </div>
                            </div>

                            {availableReceivables.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">選擇待收項目 *</label>
                                    <div className="border rounded max-h-48 overflow-y-auto">
                                        {availableReceivables.map(r => (
                                            <label key={r.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedReceivables.includes(r.id)}
                                                    onChange={e => {
                                                        if (e.target.checked) {
                                                            setSelectedReceivables([...selectedReceivables, r.id]);
                                                        } else {
                                                            setSelectedReceivables(selectedReceivables.filter(id => id !== r.id));
                                                        }
                                                    }}
                                                />
                                                <span className="flex-1 text-sm">
                                                    {r.itemName} - {r.billingCycle}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    餘額: ${Number(r.balance || r.amount).toLocaleString()}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !payerId || !dueDate || selectedReceivables.length === 0}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {creating ? '建立中...' : '建立請款單'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">請款單明細</h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="text-gray-500">請款單號:</span> {selectedInvoice.invoiceNo}</div>
                                <div><span className="text-gray-500">狀態:</span> {statusLabels[selectedInvoice.status]?.label}</div>
                                <div><span className="text-gray-500">開立日:</span> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</div>
                                <div><span className="text-gray-500">到期日:</span> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</div>
                            </div>

                            <div>
                                <h3 className="font-medium mb-2">項目明細</h3>
                                <table className="w-full text-sm border">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">科目</th>
                                            <th className="px-3 py-2 text-left">帳期</th>
                                            <th className="px-3 py-2 text-right">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map(item => (
                                            <tr key={item.id} className="border-t">
                                                <td className="px-3 py-2">{item.receivable.itemName}</td>
                                                <td className="px-3 py-2">{item.receivable.billingCycle}</td>
                                                <td className="px-3 py-2 text-right">${Number(item.amount).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-t font-bold bg-gray-50">
                                            <td colSpan={2} className="px-3 py-2 text-right">總計</td>
                                            <td className="px-3 py-2 text-right">${Number(selectedInvoice.totalAmount).toLocaleString()}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {selectedInvoice.status === 'DRAFT' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus(selectedInvoice.id, 'ISSUED')}
                                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                                    >
                                        發出
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedInvoice.id, 'CANCELLED')}
                                        className="px-3 py-1 bg-red-500 text-white rounded text-sm"
                                    >
                                        取消
                                    </button>
                                </div>
                            )}
                            {selectedInvoice.status === 'ISSUED' && (
                                <button
                                    onClick={() => updateStatus(selectedInvoice.id, 'PAID')}
                                    className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                    標記為已結清
                                </button>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedInvoice(null)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
