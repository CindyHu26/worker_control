"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Printer, RefreshCcw, Bell, Calendar } from 'lucide-react';
import ScheduleModal from '@/components/health/ScheduleModal';
import ResultModal from '@/components/health/ResultModal';
import { FileEdit } from 'lucide-react';

interface HealthCheck {
    id: string;
    checkDate: string;
    checkType: string;
    status: string; // upcoming, notified, scheduled, completed
    hospitalName?: string;
    worker: {
        id: string;
        chineseName: string | null;
        englishName: string;
        mobilePhone: string | null;
    };
    deployment?: {
        employer?: {
            companyName: string;
        }
    };
    result?: string;
    reportDate?: string;
    approvalDocNo?: string;
    failReason?: string;
}

export default function HealthCheckPage() {
    const [checks, setChecks] = useState<HealthCheck[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'upcoming_30' | 'overdue'>('upcoming_30');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Schedule Modal State
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [selectedCheck, setSelectedCheck] = useState<HealthCheck | null>(null);

    // Result Modal State
    const [resultModalOpen, setResultModalOpen] = useState(false);

    const fetchChecks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/health-checks?filter=${filter}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setChecks(data);
                setSelectedIds(new Set());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChecks();
    }, [filter]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(checks.map(c => c.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleBatchNotify = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`確定要列印並通知 ${selectedIds.size} 位移工的雇主嗎？`)) return;

        try {
            const res = await fetch('http://localhost:3001/api/health-checks/batch-notify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) }),
                credentials: 'include'
            });

            if (res.ok) {
                alert('已生成通知單並更新狀態！(Mock PDF Download)');
                fetchChecks();
            } else {
                alert('操作失敗');
            }
        } catch (err) {
            console.error(err);
            alert('系統錯誤');
        }
    };

    const handleOpenSchedule = (check: HealthCheck) => {
        setSelectedCheck(check);
        setScheduleModalOpen(true);
    };

    const handleSaveSchedule = async (data: { hospitalName: string; checkDate: string }) => {
        if (!selectedCheck) return;

        try {
            const res = await fetch(`http://localhost:3001/api/health-checks/${selectedCheck.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checkDate: data.checkDate,
                    hospitalName: data.hospitalName,
                    status: 'scheduled'
                }),
                credentials: 'include'
            });

            if (res.ok) {
                alert('安排成功');
                setScheduleModalOpen(false);
                fetchChecks();
            } else {
                alert('更新失敗');
            }
        } catch (err) {
            console.error(err);
            alert('系統錯誤');
        }
    };

    const handleOpenResult = (check: HealthCheck) => {
        setSelectedCheck(check);
        setResultModalOpen(true);
    };

    const handleSaveResult = async (data: any) => {
        if (!selectedCheck) return;

        try {
            // 1. Update Current Check
            const updateRes = await fetch(`http://localhost:3001/api/health-checks/${selectedCheck.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    result: data.result,
                    reportDate: data.reportDate,
                    approvalDocNo: data.approvalDocNo,
                    failReason: data.failReason,
                    // If result is pass/fail, status is completed
                    status: (data.result === 'pass' || data.result === 'fail' || data.result === 'needs_recheck') ? 'completed' : 'scheduled'
                }),
                credentials: 'include'
            });

            if (!updateRes.ok) throw new Error('Update failed');

            // 2. Create Re-check if requested
            if (data.createRecheck && data.recheckDeadline) {
                await fetch('http://localhost:3001/api/health-checks/create-recheck', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parentHealthCheckId: selectedCheck.id,
                        checkDate: data.recheckDeadline
                    }),
                    credentials: 'include'
                });
            }

            alert('結果更新成功');
            setResultModalOpen(false);
            fetchChecks();

        } catch (err) {
            console.error(err);
            alert('系統錯誤');
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Health Check Management (體檢管理)</h1>
                <div className="flex gap-2">
                    <button onClick={fetchChecks} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                        <RefreshCcw size={20} />
                    </button>
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBatchNotify}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
                        >
                            <Printer size={18} />
                            列印通知書 ({selectedIds.size})
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setFilter('upcoming_30')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'upcoming_30' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    即將到期 (30天)
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    逾期未檢
                </button>
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-slate-100 text-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                >
                    全部 (All)
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 w-12">
                                <input
                                    type="checkbox"
                                    checked={checks.length > 0 && selectedIds.size === checks.length}
                                    onChange={e => handleSelectAll(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="p-4 text-sm font-semibold text-slate-600">移工姓名</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">雇主</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">體檢類型</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">應檢/預約日期</th>
                            <th className="p-4 text-sm font-semibold text-slate-600">指定醫院</th>
                            <th className="p-4 text-sm font-semibold text-slate-600 w-32">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
                        ) : checks.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">目前無符合條件的體檢紀錄</td></tr>
                        ) : (
                            checks.map(check => (
                                <tr key={check.id} className="hover:bg-slate-50 transition">
                                    <td className="p-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(check.id)}
                                            onChange={() => handleSelect(check.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-900">{check.worker.englishName}</div>
                                        <div className="text-xs text-slate-500">{check.worker.chineseName || '-'}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-700">
                                        {check.deployment?.employer?.companyName || '-'}
                                    </td>
                                    <td className="p-4 text-sm text-slate-700">
                                        <div className="flex flex-col gap-1">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-xs w-fit">{check.checkType}</span>
                                            {check.status === 'notified' && (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-blue-600">
                                                    <Bell size={10} /> 已通知
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <span className={`font-medium ${new Date(check.checkDate) < new Date() && check.status !== 'completed' ? 'text-red-600' : 'text-slate-700'
                                            }`}>
                                            {format(new Date(check.checkDate), 'yyyy-MM-dd')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {check.hospitalName || <span className="text-slate-400 italic">未指定</span>}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => handleOpenSchedule(check)}
                                            className="text-slate-600 hover:text-blue-600 p-2 hover:bg-slate-100 rounded transition"
                                            title="安排預約"
                                        >
                                            <Calendar size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenResult(check)}
                                            className={`p-2 rounded transition flex items-center gap-1 ${check.result === 'pass' ? 'text-green-600 bg-green-50 hover:bg-green-100' :
                                                    check.result === 'fail' ? 'text-red-600 bg-red-50 hover:bg-red-100' :
                                                        'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                                                }`}
                                            title="登錄結果"
                                        >
                                            <FileEdit size={18} />
                                            {check.result !== 'pending' && <span className="text-xs font-bold uppercase">{check.result}</span>}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Schedule Modal */}
            <ScheduleModal
                isOpen={scheduleModalOpen}
                onClose={() => setScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
                check={selectedCheck}
            />

            <ResultModal
                isOpen={resultModalOpen}
                onClose={() => setResultModalOpen(false)}
                onSave={handleSaveResult}
                check={selectedCheck}
            />
        </div>
    );
}
