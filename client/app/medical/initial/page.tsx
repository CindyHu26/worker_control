'use client';

import React, { useState, useEffect } from 'react';
import { Stethoscope, ArrowLeft, Calendar, User, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';

export default function InitialCheckupPage() {
    const [activeTab, setActiveTab] = useState<'pending' | 'scheduled'>('pending');

    // Data States
    const [pendingEntries, setPendingEntries] = useState<any[]>([]);
    const [scheduledChecks, setScheduledChecks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [hospitalName, setHospitalName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data
    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/health-checks/pending-entry');
            if (res.ok) {
                const data = await res.json();
                setPendingEntries(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchScheduled = async () => {
        setLoading(true);
        try {
            // Fetch entry checks for next 90 days
            const res = await fetch('/api/health-checks?filter=upcoming&types=entry&days=90');
            if (res.ok) {
                const data = await res.json();
                setScheduledChecks(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPending();
        } else {
            fetchScheduled();
        }
    }, [activeTab]);

    const handleOpenSchedule = (deployment: any) => {
        setSelectedDeployment(deployment);
        setScheduleDate(new Date().toISOString().split('T')[0]); // Default today
        setHospitalName('');
        setShowScheduleModal(true);
    };

    const handleCreateSchedule = async () => {
        if (!selectedDeployment || !scheduleDate || !hospitalName) {
            alert('請填寫完整資訊');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/health-checks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId: selectedDeployment.workerId,
                    deploymentId: selectedDeployment.id,
                    checkType: 'entry',
                    checkDate: scheduleDate,
                    hospitalName
                })
            });

            if (res.ok) {
                setShowScheduleModal(false);
                fetchPending(); // Refresh list (item should disappear)
            } else {
                alert('建立失敗');
            }
        } catch (error) {
            console.error(error);
            alert('建立失敗');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PageContainer title="初次體檢管理 (Initial Checkup)" showBack onBack={() => window.location.href = '/portal'}>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'pending'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    待排程 (Pending)
                    {pendingEntries.length > 0 && (
                        <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                            {pendingEntries.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('scheduled')}
                    className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'scheduled'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    已排程 (Scheduled)
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">載入中...</div>
                ) : activeTab === 'pending' ? (
                    /* Pending Table */
                    pendingEntries.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">無待排程項目</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">移工姓名</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">雇主</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">入境日期</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">應體檢期限 (3日內)</th>
                                    <th className="px-6 py-3 text-center text-sm font-medium text-slate-500">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pendingEntries.map(dep => {
                                    const entryDate = new Date(dep.entryDate);
                                    const deadline = new Date(entryDate);
                                    deadline.setDate(deadline.getDate() + 3);
                                    const isOverdue = new Date() > deadline;

                                    return (
                                        <tr key={dep.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{dep.worker.englishName}</div>
                                                <div className="text-sm text-slate-500">{dep.worker.chineseName}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {dep.employer.companyName}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {entryDate.toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                                                    {deadline.toLocaleDateString()}
                                                    {isOverdue && <AlertCircle size={16} />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleOpenSchedule(dep)}
                                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm transition-colors"
                                                >
                                                    安排體檢
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )
                ) : (
                    /* Scheduled Table */
                    scheduledChecks.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">無已排程項目</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">移工姓名</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">安排日期</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">醫院</th>
                                    <th className="px-6 py-3 text-sm font-medium text-slate-500">狀態</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scheduledChecks.map(check => (
                                    <tr key={check.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{check.worker.englishName}</div>
                                            <div className="text-sm text-slate-500">{check.worker.chineseName}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                {new Date(check.checkDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {check.hospitalName}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                                ${check.result === 'pass' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    check.result === 'fail' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-amber-50 text-amber-700 border-amber-200'}
                                            `}>
                                                {check.result === 'pass' && <CheckCircle2 size={12} />}
                                                {check.result === 'pending' && <Clock size={12} />}
                                                {check.result === 'pending' ? '等待檢查/報告' : check.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
                )}
            </div>

            {/* Schedule Modal */}
            {showScheduleModal && selectedDeployment && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">安排初次體檢</h3>

                        <div className="space-y-4 mb-6">
                            <div className="bg-slate-50 p-3 rounded-lg text-sm">
                                <p><span className="text-slate-500">移工:</span> {selectedDeployment.worker.englishName}</p>
                                <p><span className="text-slate-500">入境日:</span> {new Date(selectedDeployment.entryDate).toLocaleDateString()}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">體檢日期</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={scheduleDate}
                                    onChange={e => setScheduleDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">醫院</label>
                                <input
                                    type="text"
                                    placeholder="例如: 衛生福利部桃園醫院"
                                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                                    value={hospitalName}
                                    onChange={e => setHospitalName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowScheduleModal(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreateSchedule}
                                disabled={submitting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {submitting ? '建立中...' : '確認安排'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </PageContainer>
    );
}
