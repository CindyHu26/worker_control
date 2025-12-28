'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Calendar, Download } from 'lucide-react';
import Link from 'next/link';
import { format, subMonths, addMonths } from 'date-fns';

interface ForecastRow {
    period: string;
    employer: string;
    worker: string;
    itemName: string;
    plannedAmount: number;
    actualAmount: number;
    status: 'PAST' | 'CURRENT' | 'FUTURE';
    isPaid: boolean;
}

interface ForecastSummary {
    pastTotal: number;
    pastPaid: number;
    currentTotal: number;
    currentPaid: number;
    futureProjected: number;
}

interface MonthlyData {
    period: string;
    planned: number;
    actual: number;
    variance: number;
}

interface Employer {
    id: string;
    companyName: string;
}

interface Worker {
    id: string;
    englishName: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
    PAST: { bg: 'bg-gray-100', text: 'text-gray-600' },
    CURRENT: { bg: 'bg-blue-100', text: 'text-blue-700' },
    FUTURE: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

export default function ForecastReportPage() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [selectedEmployers, setSelectedEmployers] = useState<string[]>([]);
    const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
    const [startMonth, setStartMonth] = useState(format(subMonths(new Date(), 3), 'yyyy-MM'));
    const [endMonth, setEndMonth] = useState(format(addMonths(new Date(), 12), 'yyyy-MM'));

    // Data
    const [rows, setRows] = useState<ForecastRow[]>([]);
    const [summary, setSummary] = useState<ForecastSummary | null>(null);
    const [monthly, setMonthly] = useState<MonthlyData[]>([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/employers').then(r => r.json()),
            fetch('/api/workers').then(r => r.json()),
        ]).then(([emp, wkr]) => {
            setEmployers(Array.isArray(emp) ? emp : []);
            setWorkers(Array.isArray(wkr) ? wkr : []);
        });
    }, []);

    const search = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedEmployers.length > 0) params.append('employerIds', selectedEmployers.join(','));
            if (selectedWorkers.length > 0) params.append('workerIds', selectedWorkers.join(','));
            params.append('startMonth', startMonth);
            params.append('endMonth', endMonth);

            const res = await fetch(`/api/receivables/forecast?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setRows(data.rows);
                setSummary(data.summary);
                setMonthly(data.monthly);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const maxAmount = Math.max(...monthly.map(m => Math.max(m.planned, m.actual)), 1);

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                        <Link href="/accounting" className="hover:text-blue-600">會計</Link>
                        <span>/</span>
                        <span className="text-slate-900 font-medium">預估與歷史報表</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/accounting" className="p-2 hover:bg-slate-100 rounded-lg">
                            <ArrowLeft size={20} className="text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <TrendingUp className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">預估與歷史報表</h1>
                                <p className="text-sm text-slate-500">Forecast & Historical Report</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <h2 className="text-lg font-semibold mb-4">篩選條件</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">雇主</label>
                            <select
                                multiple
                                value={selectedEmployers}
                                onChange={e => setSelectedEmployers(Array.from(e.target.selectedOptions, o => o.value))}
                                className="w-full border rounded px-3 py-2 h-24"
                            >
                                {employers.map(e => (
                                    <option key={e.id} value={e.id}>{e.companyName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">員工</label>
                            <select
                                multiple
                                value={selectedWorkers}
                                onChange={e => setSelectedWorkers(Array.from(e.target.selectedOptions, o => o.value))}
                                className="w-full border rounded px-3 py-2 h-24"
                            >
                                {workers.map(w => (
                                    <option key={w.id} value={w.id}>{w.englishName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">起始月份</label>
                            <input
                                type="month"
                                value={startMonth}
                                onChange={e => setStartMonth(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">結束月份</label>
                            <input
                                type="month"
                                value={endMonth}
                                onChange={e => setEndMonth(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <button
                            onClick={search}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? '查詢中...' : '查詢'}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-gray-500 text-sm">歷史應收</div>
                            <div className="text-xl font-bold text-gray-600">
                                ${summary.pastTotal.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-gray-500 text-sm">歷史已收</div>
                            <div className="text-xl font-bold text-green-600">
                                ${summary.pastPaid.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-gray-500 text-sm">本月應收</div>
                            <div className="text-xl font-bold text-blue-600">
                                ${summary.currentTotal.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-gray-500 text-sm">本月已收</div>
                            <div className="text-xl font-bold text-blue-600">
                                ${summary.currentPaid.toLocaleString()}
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow text-center">
                            <div className="text-gray-500 text-sm">未來預估</div>
                            <div className="text-xl font-bold text-purple-600">
                                ${summary.futureProjected.toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Monthly Chart (Simple bars) */}
                {monthly.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <h3 className="font-semibold mb-4">月份趨勢</h3>
                        <div className="flex items-end gap-2 h-48 overflow-x-auto pb-2">
                            {monthly.map(m => (
                                <div key={m.period} className="flex flex-col items-center min-w-12">
                                    <div className="flex gap-1">
                                        <div
                                            className="w-3 bg-blue-200 rounded-t"
                                            style={{ height: `${(m.planned / maxAmount) * 160}px` }}
                                            title={`計畫: $${m.planned.toLocaleString()}`}
                                        />
                                        <div
                                            className="w-3 bg-green-400 rounded-t"
                                            style={{ height: `${(m.actual / maxAmount) * 160}px` }}
                                            title={`實際: $${m.actual.toLocaleString()}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left">
                                        {m.period.substring(5)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 mt-2 text-sm justify-center">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded" /> 計畫</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded" /> 實際</span>
                        </div>
                    </div>
                )}

                {/* Detail Table */}
                {rows.length > 0 && (
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">帳期</th>
                                        <th className="px-4 py-3 text-left font-medium">雇主</th>
                                        <th className="px-4 py-3 text-left font-medium">員工</th>
                                        <th className="px-4 py-3 text-left font-medium">科目</th>
                                        <th className="px-4 py-3 text-right font-medium">計畫金額</th>
                                        <th className="px-4 py-3 text-right font-medium">實際金額</th>
                                        <th className="px-4 py-3 text-center font-medium">時態</th>
                                        <th className="px-4 py-3 text-center font-medium">已結清</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {rows.map((r, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono">{r.period}</td>
                                            <td className="px-4 py-3">{r.employer}</td>
                                            <td className="px-4 py-3">{r.worker}</td>
                                            <td className="px-4 py-3">{r.itemName}</td>
                                            <td className="px-4 py-3 text-right">${r.plannedAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right">${r.actualAmount.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-0.5 text-xs rounded ${statusColors[r.status].bg} ${statusColors[r.status].text}`}>
                                                    {r.status === 'PAST' && '歷史'}
                                                    {r.status === 'CURRENT' && '本月'}
                                                    {r.status === 'FUTURE' && '未來'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {r.isPaid ? '✓' : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {rows.length === 0 && !loading && (
                    <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                        請設定篩選條件後按「查詢」
                    </div>
                )}
            </div>
        </div>
    );
}
