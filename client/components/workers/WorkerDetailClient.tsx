"use client";

import { useState, useEffect } from 'react';
import { User, Briefcase, Calendar, FileText, AlertTriangle, ArrowRightLeft, XCircle, Users, Edit, FileBadge, Save } from 'lucide-react';
import AttachmentManager from '../common/AttachmentManager';
import GovtTabContent from './GovtTabContent';

export default function WorkerDetailClient({ worker }: { worker: any }) {
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('activeWorkerTab');
            if (saved) {
                localStorage.removeItem('activeWorkerTab'); // Clear after use
                return saved;
            }
        }
        return 'basic';
    });

    // Generate Doc Modal
    const [showGenDocModal, setShowGenDocModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Termination Modal
    const [showTermModal, setShowTermModal] = useState(false);
    const [termForm, setTermForm] = useState({
        endDate: '',
        reason: 'contract_terminated',
        notes: ''
    });

    const handleGenerateDoc = async (templateType: string) => {
        setIsGenerating(true);
        try {
            // Using port 3001 as server is running there
            const res = await fetch('http://localhost:3001/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateType,
                    resourceId: worker.id
                })
            });

            if (res.ok) {
                // Blob handling
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Transfer_Application_${worker.englishName.replace(/\s+/g, '_')}.docx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setShowGenDocModal(false);
            } else {
                const err = await res.json();
                alert('Generation Failed: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('System Error');
        } finally {
            setIsGenerating(false);
        }
    };

    // Transfer Modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [newEmployerId, setNewEmployerId] = useState('');
    const [transferDate, setTransferDate] = useState('');

    // Service Team Logic
    const [users, setUsers] = useState<any[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        salesId: '', serviceId: '', adminId: '', translatorId: ''
    });

    useEffect(() => {
        // Fetch Users for assignment
        fetch('http://localhost:3001/api/users')
            .then(res => res.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/assign-team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignForm)
            });
            if (res.ok) {
                alert('團隊指派成功');
                window.location.reload();
            } else {
                alert('指派失敗');
            }
        } catch (e) {
            console.error(e);
            alert('系統錯誤');
        }
    };

    // Arrange Entry Modal
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [entryForm, setEntryForm] = useState({
        flightNumber: '',
        flightArrivalDate: '',
        pickupPerson: ''
    });

    const handleEntrySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/arrange-entry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entryForm)
            });

            if (res.ok) {
                alert('安排成功！系統已更新時程。');
                localStorage.setItem('activeWorkerTab', 'timeline');
                window.location.reload();
            } else {
                alert('更新失敗');
            }
        } catch (error) {
            console.error(error);
            alert('系統錯誤');
        }
    };

    const handleTransfer = async () => {
        if (!newEmployerId || !transferDate) return alert('請填寫完整資訊');

        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmployerId, transferDate })
            });
            if (res.ok) {
                alert('轉換成功！');
                window.location.reload();
            } else {
                alert('轉換失敗');
            }
        } catch (e) {
            console.error(e);
            alert('系統錯誤');
        }
    };

    const handleTerminationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentDeployment = worker.deployments?.[0];
        if (!currentDeployment) return alert('無有效聘僱可終止');

        try {
            const res = await fetch(`http://localhost:3001/api/deployments/${currentDeployment.id}/terminate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(termForm)
            });

            if (res.ok) {
                alert('合約已終止。');
                window.location.reload();
            } else {
                const data = await res.json();
                alert('操作失敗: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('系統錯誤');
        }
    };

    const currentDeployment = worker.deployments?.[0]; // Assuming sorted by desc
    const currentTimeline = currentDeployment?.timelines;



    return (
        <div className="p-8">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-2xl">
                        {worker.englishName.charAt(0)}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{worker.chineseName} <span className="text-gray-500 text-lg">({worker.englishName})</span></h1>
                        <p className="text-gray-500 flex items-center gap-2">
                            {currentDeployment?.status === 'active' ? (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">In Service (在職中)</span>
                            ) : currentDeployment?.status === 'runaway' ? (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">Runaway (逃跑)</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">Inactive (非在職)</span>
                            )}
                            <span>護照: {worker.passports[0]?.passportNumber || '-'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Arrange Entry Button - show only if active or pending */}
                    {(currentDeployment?.status === 'active' || currentDeployment?.status === 'pending') && (
                        <>
                            <button
                                onClick={() => setShowEntryModal(true)}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors"
                            >
                                <span className="font-bold">+</span>
                                安排入境
                            </button>

                            <button
                                onClick={() => setShowTransferModal(true)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
                            >
                                <ArrowRightLeft size={18} />
                                轉換雇主
                            </button>

                            <button
                                onClick={() => setShowTermModal(true)}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition-colors"
                            >
                                <XCircle size={18} />
                                終止合約
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Service Team Widget */}
            <div className="bg-white p-6 rounded-lg shadow mb-6 border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                        <Users className="text-blue-600" size={20} /> 服務團隊 (Service Team)
                    </h3>
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
                        className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded transition flex items-center gap-1 font-medium"
                    >
                        <Edit size={14} /> 指派人員
                    </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[
                        { label: '業務人員 (Sales Agent)', role: 'sales_agent' },
                        { label: '服務人員 (Service Staff)', role: 'service_staff' },
                        { label: '行政人員 (Admin Staff)', role: 'admin_staff' },
                        { label: '翻譯人員 (Translator)', role: 'translator' }
                    ].map(item => {
                        const assigned = worker.serviceAssignments?.find((sa: any) => sa.role === item.role);
                        return (
                            <div key={item.role} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <span className="block text-xs uppercase text-slate-500 mb-1 font-semibold tracking-wider">{item.label}</span>
                                <div className={`font-bold text-base ${assigned ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                                    {assigned ? assigned.internalUser.username : '未指派'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('basic')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'basic' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <User size={18} /> 基本資料
                </button>
                <button onClick={() => setActiveTab('deployment')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'deployment' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <Briefcase size={18} /> 聘僱狀況
                </button>
                <button onClick={() => setActiveTab('timeline')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'timeline' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <Calendar size={18} /> 時程與警示
                </button>
                <button onClick={() => setActiveTab('documents')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <FileText size={18} /> 文件管理
                </button>
                <button onClick={() => setActiveTab('incidents')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'incidents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <AlertTriangle size={18} /> 事件紀錄
                </button>
                <button onClick={() => setActiveTab('govt')} className={`px-6 py-3 font-medium flex items-center gap-2 ${activeTab === 'govt' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    <FileBadge size={18} /> 行政函文
                </button>
            </div>

            {/* Content */}
            <div className="bg-white p-6 rounded-lg shadow min-h-[400px]">
                {activeTab === 'basic' && (
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-500">國籍</label>
                            <p className="mt-1 text-lg">{worker.nationality}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">生日</label>
                            <p className="mt-1 text-lg">{new Date(worker.dob).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">手機</label>
                            <p className="mt-1 text-lg">{worker.mobilePhone || '-'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500">國外地址</label>
                            <p className="mt-1 text-lg">{worker.foreignAddress || '-'}</p>
                        </div>
                    </div>
                )}

                {activeTab === 'deployment' && (
                    <div>
                        <h3 className="font-bold text-lg mb-4">目前聘僱</h3>
                        {/* Show Termination Info if ended */}
                        {currentDeployment?.terminationReason && (
                            <div className="bg-red-50 p-4 rounded border border-red-100 mb-4">
                                <h4 className="font-bold text-red-800 mb-2">合約已終止</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm text-red-700">
                                    <div>原因: {currentDeployment.terminationReason}</div>
                                    <div>日期: {currentDeployment.endDate ? new Date(currentDeployment.endDate).toLocaleDateString() : '-'}</div>
                                    <div className="col-span-2">備註: {currentDeployment.terminationNotes || '-'}</div>
                                </div>
                            </div>
                        )}

                        {currentDeployment ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                    <p className="text-sm text-gray-500">雇主 (Employer)</p>
                                    <p className="text-xl font-bold text-blue-800">{currentDeployment.employer.companyName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-gray-500">工作性質:</span> {currentDeployment.jobType}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">班別:</span> {currentDeployment.shift}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">入境日期:</span> {currentDeployment.entryDate ? new Date(currentDeployment.entryDate).toLocaleDateString() : '-'}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">班機號碼:</span> {currentDeployment.flightNumber || '-'}
                                    </div>
                                    <div>
                                        <span className="text-gray-500">起始日期:</span> {new Date(currentDeployment.startDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>無有效聘僱資料</p>
                        )}
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div>
                        <h3 className="font-bold text-lg mb-4">關鍵時程 (Timelines)</h3>
                        {!currentTimeline ? <p>尚無時程資料 - 請確認是否已安排入境或有聘僱紀錄</p> : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-green-200 bg-green-50 p-3 rounded">
                                    <span className="block text-green-800 text-sm font-semibold">入國體檢截止 (Entry Med Check)</span>
                                    <span className="text-lg font-bold text-green-900">{currentTimeline.entryMedCheckDeadline ? new Date(currentTimeline.entryMedCheckDeadline).toLocaleDateString() : '-'}</span>
                                    <p className="text-xs text-green-700 mt-1">入境後 3 日內</p>
                                </div>
                                <div className="border border-blue-200 bg-blue-50 p-3 rounded">
                                    <span className="block text-blue-800 text-sm font-semibold">居留證申請截止 (ARC Application)</span>
                                    <span className="text-lg font-bold text-blue-900">{currentTimeline.arcDeadline ? new Date(currentTimeline.arcDeadline).toLocaleDateString() : '-'}</span>
                                    <p className="text-xs text-blue-700 mt-1">入境後 15 日內</p>
                                </div>
                                <div className="border p-3 rounded opacity-75">
                                    <span className="block text-gray-500 text-sm">體檢(6個月)</span>
                                    <span className="text-lg font-medium">{currentTimeline.medCheck6moDeadline ? new Date(currentTimeline.medCheck6moDeadline).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="border p-3 rounded opacity-75">
                                    <span className="block text-gray-500 text-sm">體檢(18個月)</span>
                                    <span className="text-lg font-medium">{currentTimeline.medCheck18moDeadline ? new Date(currentTimeline.medCheck18moDeadline).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="border p-3 rounded opacity-75">
                                    <span className="block text-gray-500 text-sm">體檢(30個月)</span>
                                    <span className="text-lg font-medium">{currentTimeline.medCheck30moDeadline ? new Date(currentTimeline.medCheck30moDeadline).toLocaleDateString() : '-'}</span>
                                </div>
                                <div className="border p-3 rounded opacity-75">
                                    <span className="block text-gray-500 text-sm">居留證到期 (ARC Expiry)</span>
                                    <span className="text-lg font-medium">{currentTimeline.arcExpiryDate ? new Date(currentTimeline.arcExpiryDate).toLocaleDateString() : '-'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documents' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
                            <div>
                                <h4 className="font-semibold text-gray-700">自動文件生成</h4>
                                <p className="text-xs text-gray-500">使用目前資料產生標準表格 (DOCX/PDF)</p>
                            </div>
                            <button
                                onClick={() => setShowGenDocModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center gap-2 transition"
                            >
                                <FileText size={16} />
                                產生文件
                            </button>
                        </div>
                        <AttachmentManager refId={worker.id} refTable="workers" />
                    </div>
                )}

                {activeTab === 'incidents' && (
                    <div className="text-center py-10 text-gray-500">
                        事件紀錄模組
                    </div>
                )}

                {activeTab === 'govt' && (
                    <GovtTabContent worker={worker} currentDeployment={currentDeployment} />
                )}
            </div>

            {/* Arrange Entry Modal */}
            {
                showEntryModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                            <h2 className="text-xl font-bold mb-4">安排入境 (Arrange Entry)</h2>
                            <form onSubmit={handleEntrySubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">班機號碼 (Flight No.)</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border p-2 rounded"
                                        value={entryForm.flightNumber}
                                        onChange={e => setEntryForm({ ...entryForm, flightNumber: e.target.value })}
                                        placeholder="e.g. BR-123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">抵達日期 (Arrival Date)</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border p-2 rounded"
                                        value={entryForm.flightArrivalDate}
                                        onChange={e => setEntryForm({ ...entryForm, flightArrivalDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">接機人員 (Pickup Contact)</label>
                                    <input
                                        type="text"
                                        className="w-full border p-2 rounded"
                                        value={entryForm.pickupPerson}
                                        onChange={e => setEntryForm({ ...entryForm, pickupPerson: e.target.value })}
                                        placeholder="姓名/電話"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowEntryModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                    >
                                        確認安排
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Transfer Modal */}
            {
                showTransferModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                            <h2 className="text-xl font-bold mb-4">轉換雇主 (Transfer Employer)</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">新雇主 ID (UUID)</label>
                                    <input
                                        type="text"
                                        value={newEmployerId}
                                        onChange={e => setNewEmployerId(e.target.value)}
                                        className="w-full border p-2 rounded"
                                        placeholder="e.g. 550e8400-e29b-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">生效日期 (Effective Date)</label>
                                    <input
                                        type="date"
                                        value={transferDate}
                                        onChange={e => setTransferDate(e.target.value)}
                                        className="w-full border p-2 rounded"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowTransferModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleTransfer}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    確認轉換
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Termination Modal */}
            {showTermModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4 text-red-700">終止聘僱作業 (Terminate Deployment)</h2>
                        <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-800">
                            警告：此操作將結束該移工目前的聘僱狀態。
                        </div>
                        <form onSubmit={handleTerminationSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">離職日 / 終止日 (End Date) *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border p-2 rounded"
                                    value={termForm.endDate}
                                    onChange={e => setTermForm({ ...termForm, endDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">原因 (Reason)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={termForm.reason}
                                    onChange={e => setTermForm({ ...termForm, reason: e.target.value })}
                                >
                                    <option value="contract_terminated">雙方合意解約 / 期滿完工 (Terminated/Expired)</option>
                                    <option value="transferred_out">轉換雇主 (Transferred Out)</option>
                                    <option value="runaway">失去聯繫 (逃跑 / Runaway)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">備註 (Notes)</label>
                                <textarea
                                    className="w-full border p-2 rounded h-24"
                                    value={termForm.notes}
                                    onChange={e => setTermForm({ ...termForm, notes: e.target.value })}
                                    placeholder="輸入備註 (Enter any additional details)..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowTermModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                                >
                                    確認終止
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Service Team Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[500px]">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Users size={20} className="text-blue-600" /> 指派服務團隊 (Assign Team)
                        </h2>
                        <form onSubmit={handleAssignSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">業務人員 (Sales Agent)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={assignForm.salesId}
                                    onChange={e => setAssignForm({ ...assignForm, salesId: e.target.value })}
                                >
                                    <option value="">未指派 (Unassigned)</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">服務人員 (Service Staff)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={assignForm.serviceId}
                                    onChange={e => setAssignForm({ ...assignForm, serviceId: e.target.value })}
                                >
                                    <option value="">未指派 (Unassigned)</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">行政人員 (Admin Staff)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={assignForm.adminId}
                                    onChange={e => setAssignForm({ ...assignForm, adminId: e.target.value })}
                                >
                                    <option value="">未指派 (Unassigned)</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">翻譯人員 (Translator)</label>
                                <select
                                    className="w-full border p-2 rounded"
                                    value={assignForm.translatorId}
                                    onChange={e => setAssignForm({ ...assignForm, translatorId: e.target.value })}
                                >
                                    <option value="">未指派 (Unassigned)</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    確認指派
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Doc Modal */}
            {showGenDocModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <h2 className="text-xl font-bold mb-4">產生文件 (Generate Document)</h2>
                        <div className="space-y-4">
                            <button
                                onClick={() => handleGenerateDoc('transfer_application')}
                                disabled={isGenerating}
                                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition group"
                            >
                                <div className="text-left">
                                    <div className="font-bold text-slate-800 group-hover:text-blue-700">轉換雇主申請書</div>
                                    <div className="text-xs text-slate-500">Transfer Application</div>
                                </div>
                                <FileText className="text-slate-300 group-hover:text-blue-500" />
                            </button>
                            <button
                                disabled
                                className="w-full text-center p-3 text-sm text-slate-400 border border-dashed rounded bg-slate-50 cursor-not-allowed"
                            >
                                更多範本開發中...
                            </button>
                        </div>
                        <div className="flex justify-end mt-6">
                            <button
                                onClick={() => setShowGenDocModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
