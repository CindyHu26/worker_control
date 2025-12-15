
"use client";

import React, { useState, useEffect } from 'react';

type LaborCount = {
    year: number;
    month: number;
    count: number;
};

type CalculationResult = {
    averageLaborCount: number;
    allocationRate: number;
    baseQuota: number;
    currentMigrantCount: number;
    availableQuota: number;
    history: LaborCount[];
    isManufacturing: boolean;
};

interface QuotaCalculationCardProps {
    employerId: string;
}

export default function QuotaCalculationCard({ employerId }: QuotaCalculationCardProps) {
    const [result, setResult] = useState<CalculationResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [editData, setEditData] = useState<LaborCount[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const fetchCalculation = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employers/${employerId}/quota-calculation`);
            const data = await res.json();
            if (data.error) {
                console.error(data.error);
                return;
            }
            setResult(data);

            // Prepare edit data (ensure 12 slots?)
            // If history < 12, fill gaps? Or just show what we have.
            // Let's populate with what we have for now.
            setEditData(data.history || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalculation();
    }, [employerId]);

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/employers/${employerId}/labor-counts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: editData })
            });
            if (res.ok) {
                setIsEditing(false);
                fetchCalculation(); // Refresh
            } else {
                alert('Failed to save');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCountChange = (index: number, val: string) => {
        const newData = [...editData];
        newData[index].count = Number(val);
        setEditData(newData);
    };

    const addNewMonth = () => {
        const today = new Date();
        const lastEntry = editData.length > 0 ? editData[0] : null;

        let newYear = today.getFullYear();
        let newMonth = today.getMonth() + 1; // 1-12

        if (lastEntry) {
            // Add previous month relative to last entry?
            // Usually user wants to add specifically.
            // Simple approach: Add empty row, let user pick year/month
        }

        // Let's simplified: Auto-fill last 12 months if empty, or just add a row
        setEditData([...editData, { year: newYear, month: newMonth, count: 0 }]);
    };

    if (!result) return <div className="p-4 bg-white rounded shadow text-center">Loading Calculation...</div>;

    if (!result.isManufacturing) {
        return (
            <div className="p-4 bg-gray-50 rounded border border-gray-200 text-gray-500">
                Quota Calculation is only applicable for Manufacturing employers.
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800">3K5 Manufacturing Quota</h3>
                    <p className="text-sm text-slate-500">Automatic calculation based on domestic labor average</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{result.availableQuota}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Available Quota</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-md">
                <div>
                    <span className="block text-xs text-slate-500 uppercase">Avg. Domestic Labor</span>
                    <span className="text-lg font-semibold text-slate-800">{result.averageLaborCount.toFixed(1)}</span>
                </div>
                <div>
                    <span className="block text-xs text-slate-500 uppercase">Allocation Rate</span>
                    <span className="text-lg font-semibold text-slate-800">{(result.allocationRate * 100).toFixed(0)}%</span>
                </div>
                <div>
                    <span className="block text-xs text-slate-500 uppercase">Base Quota</span>
                    <span className="text-lg font-semibold text-slate-800">{result.baseQuota}</span>
                </div>
                <div>
                    <span className="block text-xs text-slate-500 uppercase">Active Migrants</span>
                    <span className="text-lg font-semibold text-slate-800">{result.currentMigrantCount}</span>
                </div>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <h4 className="font-semibold text-slate-700">Labor Count History (Last 12 Months)</h4>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Edit Data
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="text-sm bg-blue-600 text-white rounded px-3 py-1 hover:bg-blue-700 font-medium"
                        >
                            Save Calculation
                        </button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                        <tr>
                            <th className="px-3 py-2 rounded-l">Year / Month</th>
                            <th className="px-3 py-2 text-right rounded-r">Count</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isEditing ? (
                            editData.map((row, idx) => (
                                <tr key={`edit-${idx}`}>
                                    <td className="px-3 py-2 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                className="w-16 border rounded px-1 py-0.5"
                                                value={row.year}
                                                onChange={(e) => {
                                                    const n = [...editData];
                                                    n[idx].year = parseInt(e.target.value);
                                                    setEditData(n);
                                                }}
                                            />
                                            <span className="text-gray-400">/</span>
                                            <input
                                                type="number"
                                                className="w-12 border rounded px-1 py-0.5"
                                                value={row.month}
                                                onChange={(e) => {
                                                    const n = [...editData];
                                                    n[idx].month = parseInt(e.target.value);
                                                    setEditData(n);
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-3 py-2 text-right font-medium text-slate-800">
                                        <input
                                            type="number"
                                            className="w-20 border rounded px-1 py-0.5 text-right"
                                            value={row.count}
                                            onChange={(e) => handleCountChange(idx, e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            result.history.map((row, idx) => (
                                <tr key={`view-${idx}`}>
                                    <td className="px-3 py-2 text-slate-600">{row.year} / {String(row.month).padStart(2, '0')}</td>
                                    <td className="px-3 py-2 text-right font-medium text-slate-800">{row.count}</td>
                                </tr>
                            ))
                        )}
                        {/* Empty state */}
                        {result.history.length === 0 && !isEditing && (
                            <tr>
                                <td colSpan={2} className="px-3 py-4 text-center text-slate-400">
                                    No history data available. Click "Edit Data" to add.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                {isEditing && (
                    <button
                        onClick={addNewMonth}
                        className="mt-2 text-xs text-blue-600 hover:underline w-full text-center py-2 border-t border-dashed border-slate-200"
                    >
                        + Add Record
                    </button>
                )}
            </div>
        </div>
    );
}
