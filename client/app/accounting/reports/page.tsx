'use client';

import { useState, useEffect } from 'react';

interface Employer {
    id: string;
    companyName: string;
}

interface Worker {
    id: string;
    englishName: string;
}

interface BillingItemDefinition {
    id: string;
    code: string;
    name: string;
}

interface Receivable {
    id: string;
    workerId: string;
    employerId: string;
    billingCycle: string;
    itemName: string;
    amount: number;
    dueDate: string;
    status: string;
    balance: number;
    paidAmount: number;
    worker?: { englishName: string };
    employer?: { companyName: string };
    itemDefinition?: { name: string };
}

const statusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: '待收', color: 'bg-yellow-100 text-yellow-700' },
    PARTIAL: { label: '部分', color: 'bg-blue-100 text-blue-700' },
    PAID: { label: '已收', color: 'bg-green-100 text-green-700' },
    CANCELLED: { label: '取消', color: 'bg-gray-100 text-gray-500' },
};

export default function AccountingReportsPage() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [itemDefs, setItemDefs] = useState<BillingItemDefinition[]>([]);
    const [receivables, setReceivables] = useState<Receivable[]>([]);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Filters
    const [selectedEmployers, setSelectedEmployers] = useState<string[]>([]);
    const [selectedWorkers, setSelectedWorkers] = useState<string[]>([]);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Summary
    const [summary, setSummary] = useState({ totalAR: 0, totalPaid: 0, totalBalance: 0 });

    useEffect(() => {
        // Load filter options
        Promise.all([
            fetch('/api/employers').then(r => r.json()),
            fetch('/api/workers').then(r => r.json()),
            fetch('/api/billing-item-definitions').then(r => r.json()),
        ]).then(([emp, wkr, items]) => {
            setEmployers(Array.isArray(emp) ? emp : []);
            setWorkers(Array.isArray(wkr) ? wkr : []);
            setItemDefs(Array.isArray(items) ? items : []);
        }).catch(err => {
            console.error('Failed to load filter options:', err);
        });
    }, []);

    const search = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedEmployers.length > 0) params.append('employerIds', selectedEmployers.join(','));
            if (selectedWorkers.length > 0) params.append('workerIds', selectedWorkers.join(','));
            if (selectedItems.length > 0) params.append('itemDefinitionIds', selectedItems.join(','));
            if (selectedStatus.length > 0) params.append('status', selectedStatus.join(','));
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`/api/receivables?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setReceivables(data);

                // Calculate summary
                const totalAR = data.reduce((s: number, r: Receivable) => s + Number(r.amount), 0);
                const totalPaid = data.reduce((s: number, r: Receivable) => s + Number(r.paidAmount || 0), 0);
                setSummary({ totalAR, totalPaid, totalBalance: totalAR - totalPaid });
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams();
            if (selectedEmployers.length > 0) params.append('employerIds', selectedEmployers.join(','));
            if (selectedWorkers.length > 0) params.append('workerIds', selectedWorkers.join(','));
            if (selectedItems.length > 0) params.append('itemDefinitionIds', selectedItems.join(','));
            if (selectedStatus.length > 0) params.append('status', selectedStatus.join(','));
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const res = await fetch(`/api/receivables/export/excel?${params.toString()}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receivables_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('匯出失敗');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">帳款查詢與報表</h1>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h2 className="text-lg font-semibold mb-4">篩選條件</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                        <label className="block text-sm font-medium mb-1">科目</label>
                        <select
                            multiple
                            value={selectedItems}
                            onChange={e => setSelectedItems(Array.from(e.target.selectedOptions, o => o.value))}
                            className="w-full border rounded px-3 py-2 h-24"
                        >
                            {itemDefs.map(i => (
                                <option key={i.id} value={i.id}>{i.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">狀態</label>
                        <select
                            multiple
                            value={selectedStatus}
                            onChange={e => setSelectedStatus(Array.from(e.target.selectedOptions, o => o.value))}
                            className="w-full border rounded px-3 py-2 h-24"
                        >
                            <option value="PENDING">待收</option>
                            <option value="PARTIAL">部分收款</option>
                            <option value="PAID">已收</option>
                            <option value="CANCELLED">已取消</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">起始日期</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">結束日期</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={search}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? '查詢中...' : '查詢'}
                    </button>
                    <button
                        onClick={exportExcel}
                        disabled={exporting || receivables.length === 0}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        {exporting ? '匯出中...' : '匯出 Excel'}
                    </button>
                </div>
            </div>

            {/* Summary */}
            {receivables.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">應收總額</div>
                        <div className="text-2xl font-bold text-blue-600">
                            ${summary.totalAR.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">已收總額</div>
                        <div className="text-2xl font-bold text-green-600">
                            ${summary.totalPaid.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow text-center">
                        <div className="text-gray-500 text-sm">未收餘額</div>
                        <div className="text-2xl font-bold text-orange-600">
                            ${summary.totalBalance.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium">雇主</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">員工</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">帳期</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">科目</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">應收</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">已收</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">餘額</th>
                                <th className="px-4 py-3 text-center text-sm font-medium">狀態</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {receivables.map(r => (
                                <tr key={r.id}>
                                    <td className="px-4 py-3 text-sm">{r.employer?.companyName || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{r.worker?.englishName || '-'}</td>
                                    <td className="px-4 py-3 text-sm">{r.billingCycle}</td>
                                    <td className="px-4 py-3 text-sm">{r.itemName}</td>
                                    <td className="px-4 py-3 text-sm text-right">${Number(r.amount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-right">${Number(r.paidAmount || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium">
                                        ${Number(r.balance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 text-xs rounded ${statusLabels[r.status]?.color || ''}`}>
                                            {statusLabels[r.status]?.label || r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {receivables.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                        請設定篩選條件後按「查詢」
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
