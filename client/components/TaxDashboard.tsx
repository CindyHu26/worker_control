
"use client";

import React, { useState, useEffect } from 'react';

type TaxSummary = {
    year: number;
    stayDays: number;
    status: 'RESIDENT' | 'NON_RESIDENT';
    isApproaching: boolean;
    totalIncome: number;
    totalWithheld: number;
    taxDue: number;
    refundAmount: number;
    balance: number;
    details: string[];
};

interface TaxDashboardProps {
    workerId: string;
    employerId: string;
}

export default function TaxDashboard({ workerId, employerId }: TaxDashboardProps) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [summary, setSummary] = useState<TaxSummary | null>(null);
    const [loading, setLoading] = useState(false);

    // Form State
    const [salary, setSalary] = useState('');
    const [bonus, setBonus] = useState('');
    const [withheld, setWithheld] = useState('');
    const [payDate, setPayDate] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tax/worker/${workerId}/summary?year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setSummary(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [workerId, year]);

    const handleAddPayroll = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/tax/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId,
                    employerId,
                    payDate,
                    workPeriodStart: periodStart,
                    workPeriodEnd: periodEnd,
                    salaryAmount: Number(salary),
                    bonusAmount: Number(bonus),
                    taxWithheld: Number(withheld)
                })
            });

            if (res.ok) {
                alert('Payroll Record Added');
                // Reset form
                setSalary('');
                setBonus('');
                setWithheld('');
                // Refresh summary
                fetchSummary();
            } else {
                alert('Failed to add record');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const residencyPercent = Math.min(100, ((summary?.stayDays || 0) / 183) * 100);

    return (
        <div className="space-y-6">
            {/* Tax Year Selector */}
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800">Tax Dashboard</h3>
                <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="border rounded px-3 py-1 bg-slate-50"
                >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                </select>
            </div>

            {loading && <div>Loading Tax Data...</div>}

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Residency Status Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Residency Status (183 Days Rule)</h4>

                        <div className="flex justify-between items-end mb-2">
                            <span className="text-3xl font-bold text-slate-800">{summary.stayDays} <span className="text-base font-normal text-slate-500">days</span></span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${summary.status === 'RESIDENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {summary.status}
                            </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div className={`h-2.5 rounded-full ${summary.stayDays >= 183 ? 'bg-green-600' : 'bg-blue-600'}`} style={{ width: `${residencyPercent}%` }}></div>
                        </div>

                        {summary.isApproaching && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
                                ⚠️ Approaches Residency threshold. Review tax rates for upcoming payments.
                            </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-xs text-slate-400 uppercase">Est. Tax Due</div>
                                <div className="text-lg font-semibold text-slate-700">{summary.taxDue.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 uppercase">Paid So Far</div>
                                <div className="text-lg font-semibold text-slate-700">{summary.totalWithheld.toLocaleString()}</div>
                            </div>
                        </div>

                        <div className={`mt-4 p-3 rounded text-center font-bold ${summary.balance < 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {summary.balance < 0 ? `Est. Refund: $${Math.abs(summary.balance).toLocaleString()}` : `Est. Payable: $${summary.balance.toLocaleString()}`}
                        </div>
                    </div>

                    {/* Payroll Input Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                        <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Add Payroll Record</h4>
                        <form onSubmit={handleAddPayroll} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Work Start</label>
                                    <input type="date" required className="w-full border rounded px-2 py-1 text-sm" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Work End</label>
                                    <input type="date" required className="w-full border rounded px-2 py-1 text-sm" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Pay Date (Tax Month)</label>
                                <input type="date" required className="w-full border rounded px-2 py-1 text-sm" value={payDate} onChange={e => setPayDate(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Salary (Taxable)</label>
                                    <input type="number" required className="w-full border rounded px-2 py-1 text-sm" placeholder="0" value={salary} onChange={e => setSalary(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Bonus</label>
                                    <input type="number" className="w-full border rounded px-2 py-1 text-sm" placeholder="0" value={bonus} onChange={e => setBonus(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-500 mb-1">Tax Withheld</label>
                                <input type="number" required className="w-full border rounded px-2 py-1 text-sm" placeholder="0" value={withheld} onChange={e => setWithheld(e.target.value)} />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-slate-800 text-white rounded py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Record'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Tax Details Table */}
            {summary && summary.details.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-500 uppercase mb-4">Calculation Details / Discrepancies</h4>
                    <ul className="text-xs text-slate-600 space-y-2">
                        {summary.details.map((d, i) => (
                            <li key={i} className="p-2 bg-slate-50 rounded border border-slate-100">{d}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
