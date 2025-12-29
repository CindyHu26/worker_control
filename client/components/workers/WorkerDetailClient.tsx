"use client";

import { useState, useEffect } from 'react';


import { User, Briefcase, Calendar, FileText, Home, ArrowRightLeft, XCircle, Users, Edit, CheckCircle, ListChecks, UserX } from 'lucide-react';

import IdentityTab from './IdentityTab';
import JobTab from './JobTab';
import { WorkflowTracker } from "@/components/deployments/WorkflowTracker";
import FinanceTab from './FinanceTab';
import DormTab from './DormTab';
import DocumentsTab from './DocumentsTab';
import WorkerSummaryBoard from './WorkerSummaryBoard';

export default function WorkerDetailClient({ worker: initialWorker }: { worker: any }) {
    const [worker, setWorker] = useState(initialWorker);
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('activeWorkerTab');
            if (saved) {
                localStorage.removeItem('activeWorkerTab');
                return saved;
            }
        }
        return 'basic'; // Identity
    });

    // Modals State
    const [showTermModal, setShowTermModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Form States for Modals
    const [termForm, setTermForm] = useState({ endDate: '', reason: 'contract_terminated', notes: '' });
    const [newEmployerId, setNewEmployerId] = useState('');
    const [transferDate, setTransferDate] = useState('');
    const [entryForm, setEntryForm] = useState({ flightNumber: '', flightArrivalDate: '', pickupPerson: '' });
    const [assignForm, setAssignForm] = useState({ salesId: '', serviceId: '', adminId: '', translatorId: '' });

    // Service Team Users
    const [users, setUsers] = useState<any[]>([]);

    // Termination Check State
    const [termCheck, setTermCheck] = useState<any>(null);
    const [isChecking, setIsChecking] = useState(false);

    // Health Status State
    const [healthStatus, setHealthStatus] = useState<any>(null);

    // Dashboard Data State
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isDashboardLoading, setIsDashboardLoading] = useState(false);

    useEffect(() => {
        // Fetch Users for assignment
        fetch('http://localhost:3001/api/users')
            .then(res => res.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(console.error);

        // Fetch Health Status
        fetch(`http://localhost:3001/api/compliance/workers/${initialWorker.id}/health`)
            .then(res => res.json())
            .then(data => setHealthStatus(data))
            .catch(console.error);

        // Fetch Dashboard Data
        setIsDashboardLoading(true);
        fetch(`http://localhost:3001/api/workers/${initialWorker.id}/dashboard`)
            .then(res => res.json())
            .then(data => setDashboardData(data))
            .catch(console.error)
            .finally(() => setIsDashboardLoading(false));
    }, [initialWorker.id]);

    const currentDeployment = worker.deployments?.[0] || null;

    useEffect(() => {
        if (showTermModal && currentDeployment?.id) {
            setIsChecking(true);
            fetch(`http://localhost:3001/api/deployments/${currentDeployment.id}/termination-check`)
                .then(res => res.json())
                .then(data => setTermCheck(data))
                .catch(console.error)
                .finally(() => setIsChecking(false));
        } else {
            setTermCheck(null);
        }
    }, [showTermModal, currentDeployment?.id]);

    // Handlers
    const handleUpdate = async () => {
        // Re-fetch worker data
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}`);
            if (res.ok) {
                const updated = await res.json();
                setWorker(updated);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const updateDeployment = async (data: any) => {
        if (!currentDeployment) return;
        try {
            const res = await fetch(`http://localhost:3001/api/deployments/${currentDeployment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                handleUpdate();
            } else {
                alert('Update Failed');
            }
        } catch (error) {
            console.error(error);
            alert('Update Failed');
        }
    };

    const handleEntrySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch(`http://localhost:3001/api/deployments/${currentDeployment?.id}/entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryForm)
            });
            setShowEntryModal(false);
            handleUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleTransfer = async () => {
        try {
            await fetch(`http://localhost:3001/api/workers/${worker.id}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmployerId, transferDate })
            });
            setShowTransferModal(false);
            handleUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleTerminationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch(`http://localhost:3001/api/deployments/${currentDeployment?.id}/terminate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(termForm)
            });
            setShowTermModal(false);
            handleUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch(`http://localhost:3001/api/workers/${worker.id}/assign-team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignForm)
            });
            setShowAssignModal(false);
            handleUpdate();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8">
            {/* 1. High-Density Dashboard (New requested feature) */}
            <WorkerSummaryBoard data={dashboardData} />

            {/* Header / Summary Card (Existing) */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                            {worker.englishName.charAt(0)}
                        </div>
                        {healthStatus && (
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${healthStatus.status === 'GREEN' ? 'bg-green-500' :
                                healthStatus.status === 'YELLOW' ? 'bg-yellow-400' : 'bg-red-500'
                                }`} title={healthStatus.issues?.join('\n') || 'All Good'}>
                                {healthStatus.status === 'GREEN' && <CheckCircle size={14} className="text-white" />}
                                {healthStatus.status === 'YELLOW' && <span className="text-white text-xs font-bold">!</span>}
                                {healthStatus.status === 'RED' && <span className="text-white text-xs font-bold">!</span>}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{worker.chineseName} <span className="text-gray-500 text-lg">({worker.englishName})</span></h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            {currentDeployment?.status === 'active' ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">In Service (在職中)</span>
                            ) : currentDeployment?.status === 'runaway' ? (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Runaway (逃跑)</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">Inactive ({currentDeployment?.status || '非在職'})</span>
                            )}
                            <span className="text-sm">| 護照: {worker.passports?.[0]?.passportNumber || '-'}</span>
                            <span className="text-sm">| 居留證: {worker.arcs?.[0]?.arcNumber || '-'}</span>
                        </p>
                    </div>
                </div>
                {/* ... (Actions) ... */}
                <div className="flex gap-2">
                    {/* Action Buttons */}
                    {(currentDeployment?.status === 'active' || currentDeployment?.status === 'pending') && (
                        <>
                            <button onClick={() => setShowEntryModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <span className="font-bold">+</span> 安排入境
                            </button>
                            <button onClick={() => window.location.href = `/workers/${worker.id}/relocate`} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <Home size={16} /> 變更住宿
                            </button>
                            <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <ArrowRightLeft size={16} /> 轉換雇主
                            </button>
                            <button onClick={() => setShowTermModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <XCircle size={16} /> 終止合約
                            </button>
                            <button onClick={() => window.location.href = '/runaway/new'} className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <UserX size={16} /> 通報失聯
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Service Team Bar (Compact) */}
            <div className="bg-slate-50 px-6 py-4 rounded-lg shadow-sm mb-6 border border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                        <Users size={16} /> Service Team
                    </h3>
                    <div className="flex gap-4">
                        {[
                            { label: '業務', role: 'sales_agent' },
                            { label: '服務', role: 'service_staff' },
                            { label: '行政', role: 'admin_staff' },
                            { label: '翻譯', role: 'translator' }
                        ].map(item => {
                            const assigned = worker.serviceAssignments?.find((sa: any) => sa.role === item.role);
                            return (
                                <div key={item.role} className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-400">{item.label}:</span>
                                    <span className={`font-medium ${assigned ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                        {assigned ? assigned.internalUser.username : '-'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <button
                    onClick={() => {
                        const map: any = {};
                        worker.serviceAssignments?.forEach((sa: any) => {
                            if (sa.role === 'sales_agent') map.salesId = sa.internalUserId;
                            if (sa.role === 'service_staff') map.serviceId = sa.internalUserId;
                            if (sa.role === 'admin_staff') map.adminId = sa.internalUserId;
                            if (sa.role === 'translator') map.translatorId = sa.internalUserId;
                        });
                        setAssignForm({
                            salesId: map.salesId || '',
                            serviceId: map.serviceId || '',
                            adminId: map.adminId || '',
                            translatorId: map.translatorId || ''
                        });
                        setShowAssignModal(true);
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                    <Edit size={12} /> Edit Team
                </button>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-t-lg border-b border-gray-200 shadow-sm mb-0">
                <div className="flex overflow-x-auto">
                    <button onClick={() => setActiveTab('basic')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <User size={18} /> 基本資料
                    </button>
                    <button onClick={() => setActiveTab('job')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'job' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <Briefcase size={18} /> 聘僱與證件
                    </button>
                    <button onClick={() => setActiveTab('finance')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'finance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <div className="flex items-center text-lg">NT$</div> 財務管理
                    </button>
                    <button onClick={() => setActiveTab('dorm')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'dorm' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <Home size={18} /> 宿舍管理
                    </button>
                    <button onClick={() => setActiveTab('docs')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'docs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <FileText size={18} /> 行政文件 (Batch)
                    </button>
                    <button onClick={() => setActiveTab('workflow')} className={`shrink-0 px-6 py-4 font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'workflow' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        <ListChecks size={18} /> 流程控管 (Workflow)
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-8 rounded-b-lg shadow min-h-[500px]">
                {activeTab === 'basic' && <IdentityTab worker={worker} onUpdate={handleUpdate} />}
                {activeTab === 'job' && <JobTab worker={worker} currentDeployment={currentDeployment} onUpdate={updateDeployment} />}
                {activeTab === 'finance' && <FinanceTab worker={worker} onUpdate={handleUpdate} />}
                {activeTab === 'dorm' && <DormTab worker={worker} />}

                {activeTab === 'docs' && <DocumentsTab worker={worker} />}
                {activeTab === 'workflow' && currentDeployment && (
                    <WorkflowTracker deployment={currentDeployment} onUpdate={updateDeployment} />
                )}
                {activeTab === 'workflow' && !currentDeployment && (
                    <div className="text-center text-gray-500 py-10">No active deployment to track.</div>
                )}
            </div>

            {/* --- Modals (Entry, Transfer, Terminate, Assign) --- */}

            {/* Create Entry Modal */}
            {showEntryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4">安排入境 (Arrange Entry)</h2>
                        <form onSubmit={handleEntrySubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">班機號碼 (Flight No.)</label>
                                <input type="text" required className="w-full border p-2 rounded" value={entryForm.flightNumber} onChange={e => setEntryForm({ ...entryForm, flightNumber: e.target.value })} placeholder="e.g. BR-123" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">抵達日期 (Arrival Date)</label>
                                <input type="date" required className="w-full border p-2 rounded" value={entryForm.flightArrivalDate} onChange={e => setEntryForm({ ...entryForm, flightArrivalDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">接機人員 (Pickup Contact)</label>
                                <input type="text" className="w-full border p-2 rounded" value={entryForm.pickupPerson} onChange={e => setEntryForm({ ...entryForm, pickupPerson: e.target.value })} placeholder="姓名/電話" />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowEntryModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">確認安排</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4">轉換雇主 (Transfer Employer)</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">新雇主 ID (UUID)</label>
                                <input type="text" value={newEmployerId} onChange={e => setNewEmployerId(e.target.value)} className="w-full border p-2 rounded" placeholder="e.g. 550e8400-e29b-..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">生效日期 (Effective Date)</label>
                                <input type="date" value={transferDate} onChange={e => setTransferDate(e.target.value)} className="w-full border p-2 rounded" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                            <button onClick={handleTransfer} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">確認轉換</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Termination Modal */}
            {showTermModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4 text-red-700">終止聘僱作業</h2>
                        <form onSubmit={handleTerminationSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">離職日 / 終止日</label>
                                <input type="date" required className="w-full border p-2 rounded" value={termForm.endDate} onChange={e => setTermForm({ ...termForm, endDate: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">原因</label>
                                <select className="w-full border p-2 rounded" value={termForm.reason} onChange={e => setTermForm({ ...termForm, reason: e.target.value })}>
                                    <option value="contract_terminated">雙方合意解約 / 期滿</option>
                                    <option value="transferred_out">轉換雇主</option>
                                    <option value="runaway">失去聯繫 (逃跑)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">備註</label>
                                <textarea className="w-full border p-2 rounded h-24" value={termForm.notes} onChange={e => setTermForm({ ...termForm, notes: e.target.value })} />
                            </div>

                            {/* Termination Check Results */}
                            <div className="bg-slate-50 p-4 rounded border border-slate-200 text-sm">
                                <h4 className="font-bold mb-3 flex items-center gap-2">
                                    <ListChecks size={16} /> 離境前檢查 (Pre-termination Check)
                                </h4>
                                {isChecking ? (
                                    <div className="text-slate-500">Checking status...</div>
                                ) : termCheck ? (
                                    <div className="space-y-2">
                                        <div className={`flex items-center gap-2 ${termCheck.checks.hasOutstandingLoans ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                            {termCheck.checks.hasOutstandingLoans ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                            <span>財務貸款: {termCheck.checks.hasOutstandingLoans ? `尚有餘額 $${termCheck.checks.outstandingLoanAmount}` : '已結清'}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${termCheck.checks.hasUnpaidBills ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                            {termCheck.checks.hasUnpaidBills ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                            <span>帳單費用: {termCheck.checks.hasUnpaidBills ? `${termCheck.checks.unpaidBillCount} 筆未繳 ($${termCheck.checks.unpaidBillTotal})` : '已結清'}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${termCheck.checks.hasActiveDorm ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                            {termCheck.checks.hasActiveDorm ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                            <span>宿舍退宿: {termCheck.checks.hasActiveDorm ? `未退宿 (${termCheck.checks.dormName} - ${termCheck.checks.bedCode})` : '已完成'}</span>
                                        </div>
                                        <div className={`flex items-center gap-2 ${termCheck.checks.hasActiveInsurance ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                            {termCheck.checks.hasActiveInsurance ? <XCircle size={14} /> : <CheckCircle size={14} />}
                                            <span>保險退保: {termCheck.checks.hasActiveInsurance ? `尚有 ${termCheck.checks.activeInsuranceCount} 項有效保險` : '已完成'}</span>
                                        </div>

                                        {!termCheck.isClear && (
                                            <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-xs border border-yellow-200 rounded">
                                                <span className="font-bold">Notice:</span> Proceeding will terminate the deployment, but outstanding items may require manual follow-up.
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-slate-400">無法取得檢查資訊</div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowTermModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded shadow transition-colors flex items-center gap-2 ${termCheck?.isClear ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                                >
                                    {termCheck?.isClear ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                    {termCheck?.isClear ? '確認結案 (Cofrim)' : '強制結案 (Force Terminate)'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Team Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4">指派服務團隊 (Assign Team)</h2>
                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">業務人員</label>
                                <select className="w-full border p-2 rounded" value={assignForm.salesId} onChange={e => setAssignForm({ ...assignForm, salesId: e.target.value })}>
                                    <option value="">未指派</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">服務人員</label>
                                <select className="w-full border p-2 rounded" value={assignForm.serviceId} onChange={e => setAssignForm({ ...assignForm, serviceId: e.target.value })}>
                                    <option value="">未指派</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">行政人員</label>
                                <select className="w-full border p-2 rounded" value={assignForm.adminId} onChange={e => setAssignForm({ ...assignForm, adminId: e.target.value })}>
                                    <option value="">未指派</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">翻譯人員</label>
                                <select className="w-full border p-2 rounded" value={assignForm.translatorId} onChange={e => setAssignForm({ ...assignForm, translatorId: e.target.value })}>
                                    <option value="">未指派</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">確認指派</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
