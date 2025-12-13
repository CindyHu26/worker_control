"use client";

import { useState, useEffect } from 'react';
import { User, Briefcase, Calendar, FileText, Home, ArrowRightLeft, XCircle, Users, Edit } from 'lucide-react';

import IdentityTab from './IdentityTab';
import JobTab from './JobTab';
import FinanceTab from './FinanceTab';
import DormTab from './DormTab';
import DocumentsTab from './DocumentsTab';

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

    useEffect(() => {
        // Fetch Users for assignment
        fetch('http://localhost:3001/api/users')
            .then(res => res.json())
            .then(data => setUsers(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    // Central Update Handler
    const handleUpdate = async (updatedFields: any) => {
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields)
            });

            if (res.ok) {
                // Better approach: Re-fetch entire worker to ensure data consistency
                const fullRes = await fetch(`http://localhost:3001/api/workers/${worker.id}`);
                const fullData = await fullRes.json();
                setWorker(fullData);
            } else {
                const err = await res.json();
                alert('Update Failed: ' + (err.error || 'Unknown error'));
                throw new Error(err.error);
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    // --- Specific Action Handlers (Entry, Transfer, Terminate, Assign) ---

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
                localStorage.setItem('activeWorkerTab', 'job'); // Switch to job tab
                window.location.reload();
            } else {
                alert('更新失敗');
            }
        } catch (error) { console.error(error); alert('系統錯誤'); }
    };

    const handleTransfer = async () => {
        if (!newEmployerId || !transferDate) return alert('請填寫完整資訊');
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newEmployerId, transferDate })
            });
            if (res.ok) { alert('轉換成功！'); window.location.reload(); }
            else { alert('轉換失敗'); }
        } catch (e) { console.error(e); alert('系統錯誤'); }
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
            if (res.ok) { alert('合約已終止。'); window.location.reload(); }
            else { const data = await res.json(); alert('操作失敗: ' + data.error); }
        } catch (e) { console.error(e); alert('系統錯誤'); }
    };

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/assign-team`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignForm)
            });
            if (res.ok) { alert('團隊指派成功'); window.location.reload(); }
            else { alert('指派失敗'); }
        } catch (e) { console.error(e); alert('系統錯誤'); }
    };

    // Helper: Current Deployment
    const currentDeployment = worker.deployments?.[0]; // Assuming sorted by desc

    return (
        <div className="p-8">
            {/* Header / Summary Card */}
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
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">Inactive ({currentDeployment?.status || '非在職'})</span>
                            )}
                            <span className="text-sm">| 護照: {worker.passports?.[0]?.passportNumber || '-'}</span>
                            <span className="text-sm">| 居留證: {worker.arcs?.[0]?.arcNumber || '-'}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Action Buttons */}
                    {(currentDeployment?.status === 'active' || currentDeployment?.status === 'pending') && (
                        <>
                            <button onClick={() => setShowEntryModal(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <span className="font-bold">+</span> 安排入境
                            </button>
                            <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <ArrowRightLeft size={16} /> 轉換雇主
                            </button>
                            <button onClick={() => setShowTermModal(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition-colors text-sm">
                                <XCircle size={16} /> 終止合約
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
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white p-8 rounded-b-lg shadow min-h-[500px]">
                {activeTab === 'basic' && <IdentityTab worker={worker} onUpdate={handleUpdate} />}
                {activeTab === 'job' && <JobTab worker={worker} currentDeployment={currentDeployment} onUpdate={handleUpdate} />}
                {activeTab === 'finance' && <FinanceTab worker={worker} onUpdate={handleUpdate} />}
                {activeTab === 'dorm' && <DormTab worker={worker} />}
                {activeTab === 'docs' && <DocumentsTab worker={worker} />}
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
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowTermModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">確認終止</button>
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
