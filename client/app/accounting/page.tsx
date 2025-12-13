"use client";

import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle, Plus, DollarSign, FileText,
    AlertTriangle, Search, Filter, ArrowRight, User
} from 'lucide-react';

export default function AccountingPage() {
    // Shared State
    const [activeTab, setActiveTab] = useState<'draft' | 'issued' | 'paid'>('draft');
    const [bills, setBills] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Summary Metrics
    const [summary, setSummary] = useState({ total: 0, count: 0 });

    // --- Modal State ---

    // 1. Monthly Fee Generation Modal
    const [showMonthlyModal, setShowMonthlyModal] = useState(false);
    const [monthlyForm, setMonthlyForm] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });
    const [monthlyResult, setMonthlyResult] = useState<any>(null);

    // 2. Fixed Fee Creation Modal
    const [showFixedModal, setShowFixedModal] = useState(false);
    const [fixedForm, setFixedForm] = useState({
        workerId: '',
        feeType: 'arc_fee',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [workers, setWorkers] = useState<any[]>([]); // For dropdown

    // --- Fetch Data ---

    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/accounting/bills?status=${activeTab === 'draft' ? 'draft' : activeTab === 'issued' ? 'issued' : 'paid'}`); // Simplify filter for now
            // Actually, let's fetch all and filter client side for smoother tab switching if list is small? 
            // Better to stick to API filtering if list grows.
            // Let's modify API call to fetch `status` based on tab.
            if (res.ok) {
                const data = await res.json();
                setBills(data);

                // Calculate Summary
                const total = data.reduce((sum: number, b: any) => sum + Number(b.totalAmount), 0);
                setSummary({ total, count: data.length });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/workers?status=active');
            if (res.ok) {
                const { data } = await res.json();
                setWorkers(data || []);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchBills();
    }, [activeTab]);

    useEffect(() => {
        if (showFixedModal) fetchWorkers();
    }, [showFixedModal]);

    // --- Handlers ---

    const handleGenerateMonthly = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/accounting/generate-monthly-fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(monthlyForm)
            });
            const data = await res.json();
            if (res.ok) {
                setMonthlyResult(data);
                fetchBills(); // Refresh list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFixed = async () => {
        if (!fixedForm.workerId || !fixedForm.amount) return;
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/accounting/bills/create-fixed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...fixedForm,
                    billDate: fixedForm.date
                })
            });
            if (res.ok) {
                setShowFixedModal(false);
                setFixedForm({ ...fixedForm, amount: '', description: '' });
                fetchBills();
                alert('固定費用帳單已建立 (Fixed Fee Bill Created)');
            } else {
                const err = await res.json();
                alert('Failed: ' + err.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">財務管理 (Accounting)</h1>
                    <p className="text-slate-500 mt-2">管理移工服務費與代墊款項帳單</p>
                </div>

                {/* Summary Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Receivables ({activeTab})</div>
                        <div className="text-2xl font-bold text-slate-900">NT$ {summary.total.toLocaleString()}</div>
                    </div>
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Button A: Monthly Fees */}
                <button
                    onClick={() => setShowMonthlyModal(true)}
                    className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all group"
                >
                    <div className="text-left">
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <Calendar className="text-blue-200" />
                            本月服務費批次結算
                        </h3>
                        <p className="text-blue-100 text-sm opacity-90">Generate Monthly Fees (Service & Dorm)</p>
                    </div>
                    <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                </button>

                {/* Button B: Fixed Fees */}
                <button
                    onClick={() => setShowFixedModal(true)}
                    className="flex items-center justify-between p-6 bg-white border-2 border-slate-200 text-slate-700 rounded-xl shadow hover:border-blue-400 hover:text-blue-600 transition-all group"
                >
                    <div className="text-left">
                        <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                            <Plus className="bg-slate-100 rounded-full p-1" size={28} />
                            新增規費/代辦費
                        </h3>
                        <p className="text-slate-500 text-sm group-hover:text-blue-400">Add One-time Fee (ARC, Medical, etc.)</p>
                    </div>
                    <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 text-blue-500" />
                </button>
            </div>

            {/* Bill List Section */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    {['draft', 'issued', 'paid'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-8 py-4 font-bold text-sm uppercase tracking-wide border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64 text-slate-400">Loading...</div>
                    ) : bills.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <FileText size={48} className="opacity-20 mb-4" />
                            <p>No {activeTab} bills found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
                                <tr>
                                    <th className="p-4">Bill No</th>
                                    <th className="p-4">Worker</th>
                                    <th className="p-4">Period</th>
                                    <th className="p-4">Items</th>
                                    <th className="p-4 text-right">Amount</th>
                                    <th className="p-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {bills.map(bill => (
                                    <tr key={bill.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 font-mono text-slate-600">{bill.billNo}</td>
                                        <td className="p-4 font-bold text-slate-800">
                                            {bill.worker?.chineseName} <span className="text-slate-400 font-normal">{bill.worker?.englishName}</span>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {bill.year}/{String(bill.month).padStart(2, '0')}
                                        </td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate" title={bill.items?.map((i: any) => i.description).join(', ')}>
                                            {bill.items?.length > 0 ? bill.items[0].description + (bill.items.length > 1 ? ` (+${bill.items.length - 1} more)` : '') : '-'}
                                        </td>
                                        <td className="p-4 text-right font-bold font-mono">
                                            ${Number(bill.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${bill.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    bill.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {bill.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Monthly Fee Modal */}
            {showMonthlyModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar className="text-blue-600" /> Generate Monthly Fees
                        </h2>

                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800 mb-6 flex gap-2">
                            <AlertTriangle className="shrink-0" size={18} />
                            <p>此操作將依據移工實際在職天數計算服務費與宿舍費 (Pro-rata calculation based on active days).</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-1">Year</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded"
                                    value={monthlyForm.year}
                                    onChange={e => setMonthlyForm({ ...monthlyForm, year: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Month</label>
                                <select
                                    className="w-full border p-2 rounded bg-white"
                                    value={monthlyForm.month}
                                    onChange={e => setMonthlyForm({ ...monthlyForm, month: Number(e.target.value) })}
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>{m}月</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {monthlyResult && (
                            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded mb-4 text-sm">
                                {monthlyResult.message}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setShowMonthlyModal(false); setMonthlyResult(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Close</button>
                            <button onClick={handleGenerateMonthly} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                                {loading ? 'Processing...' : 'Start Generation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Fee Modal */}
            {showFixedModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Plus className="text-blue-600" /> New Fixed Fee Bill
                        </h2>

                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800 mb-6">
                            此費用為固定金額，不按天數比例計算 (One-time fixed amount).
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Worker</label>
                                <select
                                    className="w-full border p-2 rounded bg-white"
                                    value={fixedForm.workerId}
                                    onChange={e => setFixedForm({ ...fixedForm, workerId: e.target.value })}
                                >
                                    <option value="">-- Select Worker --</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.chineseName} {w.englishName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fee Type</label>
                                    <select
                                        className="w-full border p-2 rounded bg-white"
                                        value={fixedForm.feeType}
                                        onChange={e => setFixedForm({ ...fixedForm, feeType: e.target.value })}
                                    >
                                        <option value="arc_fee">居留證費 (ARC)</option>
                                        <option value="medical_fee">體檢費 (Medical)</option>
                                        <option value="passport_fee">護照費 (Passport)</option>
                                        <option value="other_fee">其他 (Other)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Amount (NT$)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={fixedForm.amount}
                                        onChange={e => setFixedForm({ ...fixedForm, amount: e.target.value })}
                                        placeholder="e.g. 1000"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={fixedForm.description}
                                    onChange={e => setFixedForm({ ...fixedForm, description: e.target.value })}
                                    placeholder="e.g. 2024 ARC Renewal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Bill Date</label>
                                <input
                                    type="date"
                                    className="w-full border p-2 rounded"
                                    value={fixedForm.date}
                                    onChange={e => setFixedForm({ ...fixedForm, date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowFixedModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                            <button onClick={handleCreateFixed} disabled={!fixedForm.workerId || !fixedForm.amount} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50">
                                Create Bill
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
