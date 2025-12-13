"use client";

import React, { useState } from 'react';
import { CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface FeeSchedule {
    id: string;
    installmentNo: number;
    scheduleDate: string;
    expectedAmount: number;
    paidAmount: number;
    status: 'pending' | 'partial' | 'paid' | 'overdue';
    description?: string;
    billId?: string;
}

interface FeeScheduleTableProps {
    schedules: FeeSchedule[];
    onRefresh: () => void;
}

export default function FeeScheduleTable({ schedules, onRefresh }: FeeScheduleTableProps) {
    const [selectedSchedule, setSelectedSchedule] = useState<FeeSchedule | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const getStatusBadge = (status: string, date: string, balance: number) => {
        const isOverdue = new Date(date) < new Date() && balance > 0;

        if (status === 'paid') return <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-bold">Paid</span>;
        if (status === 'partial') return <span className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-xs font-bold">Partial</span>;
        if (isOverdue) return <span className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-bold">Overdue</span>;
        return <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-bold">Pending</span>;
    };

    const handleRowClick = (sch: FeeSchedule) => {
        // Only allow payment if linked to a bill? Or allow ad-hoc payment against schedule using a flexible API?
        // Requirement said: Click row to open Payment Modal.
        // Backend only supports POST /bills/pay.
        // Logic: specific schedule payment is complex if not through bill.
        // Workaround: We will simulate payment by asking user to pay the linked Bill. 
        // If no bill, we can't pay.

        if (sch.billId) {
            setSelectedSchedule(sch);
            setShowPaymentModal(true);
        } else {
            alert('此期尚未產生帳單，無法收款。\nPlease generate a monthly bill first.');
        }
    };

    const handlePayment = async () => {
        if (!selectedSchedule || !selectedSchedule.billId) return;

        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/accounting/bills/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    billId: selectedSchedule.billId,
                    amount: paymentAmount,
                    paymentDate: new Date().toISOString()
                })
            });

            if (res.ok) {
                alert('Payment Recorded Successfully!');
                setShowPaymentModal(false);
                setPaymentAmount('');
                onRefresh();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to record payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">服務費分期計畫 (Fee Schedule)</h3>
                <span className="text-xs text-slate-500">點擊項目可進行收款 (Click row to pay)</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-slate-600 font-medium sticky top-0 z-10">
                        <tr>
                            <th className="p-3">期數 (No.)</th>
                            <th className="p-3">預定日期 (Due)</th>
                            <th className="p-3">項目 (Item)</th>
                            <th className="p-3 text-right">應收 (Exp)</th>
                            <th className="p-3 text-right">實收 (Paid)</th>
                            <th className="p-3 text-right">餘額 (Balance)</th>
                            <th className="p-3 text-center">狀態 (Status)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {schedules.map(sch => {
                            const balance = Number(sch.expectedAmount) - Number(sch.paidAmount);
                            const isLate = new Date(sch.scheduleDate) < new Date() && balance > 0;

                            return (
                                <tr
                                    key={sch.id}
                                    onClick={() => handleRowClick(sch)}
                                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                    <td className="p-3 text-center w-16">{sch.installmentNo}</td>
                                    <td className="p-3 w-32">{new Date(sch.scheduleDate).toLocaleDateString()}</td>
                                    <td className="p-3 max-w-xs truncate text-slate-600 font-medium">
                                        {sch.description || `第 ${sch.installmentNo} 期`}
                                    </td>
                                    <td className="p-3 text-right font-mono">${Number(sch.expectedAmount).toLocaleString()}</td>
                                    <td className="p-3 text-right font-mono text-green-600 font-bold">${Number(sch.paidAmount).toLocaleString()}</td>
                                    <td className={`p-3 text-right font-mono ${isLate ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                        ${balance.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        {getStatusBadge(sch.status, sch.scheduleDate, balance)}
                                    </td>
                                </tr>
                            );
                        })}
                        {schedules.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-400">
                                    No schedule generated yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedSchedule && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                        <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="text-blue-600" /> 收款 (Payment)
                        </h4>

                        <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">項目 (Item):</span>
                                <span className="font-bold">{selectedSchedule.description}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">應收 (Expected):</span>
                                <span className="font-mono">${Number(selectedSchedule.expectedAmount).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">已收 (Paid):</span>
                                <span className="font-mono text-green-600">${Number(selectedSchedule.paidAmount).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-2 flex justify-between">
                                <span className="text-slate-500">餘額 (Balance):</span>
                                <span className="font-mono text-red-600 font-bold">
                                    ${(Number(selectedSchedule.expectedAmount) - Number(selectedSchedule.paidAmount)).toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold mb-2">本次實收金額 (Payment Amount)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                <input
                                    type="number"
                                    className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-lg py-2 pl-8 pr-4 text-lg font-bold"
                                    placeholder="Enter amount"
                                    value={paymentAmount}
                                    onChange={e => setPaymentAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPaymentModal(false); setPaymentAmount(''); }}
                                className="flex-1 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold text-slate-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={loading || !paymentAmount}
                                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
