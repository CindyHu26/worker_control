"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, User, ArrowLeft, Send, CheckCircle, XCircle, Calculator, AlertTriangle, Building, FileText } from 'lucide-react';

type Lead = {
    id: string;
    companyName: string | null;
    contactPerson: string | null;
    jobTitle: string | null;
    phone: string | null;
    mobile: string | null;
    email: string | null;
    address: string | null;
    industry: string | null;
    status: string;
    source: string | null;
    assignedTo: string | null;
    nextFollowUpDate: string | null;
    interactions: Interaction[];
};

type Interaction = {
    id: string;
    type: string;
    summary: string;
    detailedNotes: string | null;
    date: string;
    outcome: string | null;
};

export default function LeadDetailPage({ params }: { params: { id: string } }) {
    const { id } = params;
    const router = useRouter();

    const [lead, setLead] = useState<Lead | null>(null);
    const [loading, setLoading] = useState(true);

    // Quota Simulation State
    const [simDomesticWorkers, setSimDomesticWorkers] = useState<number>(0);
    const [simAllocationRate, setSimAllocationRate] = useState<number>(0.15);
    const [simQuota, setSimQuota] = useState<number>(0);

    // Helper: Calculate 3K5 Quota (matching backend logic)
    const calculate3K5Quota = (laborCount: number, rate: number): number => {
        const raw = laborCount * rate;
        if (raw === Math.floor(raw)) return raw;
        const firstDecimal = Math.floor((raw * 10) % 10);
        return firstDecimal > 0 ? Math.ceil(raw) : Math.floor(raw);
    };

    // Interaction Form State
    const [newType, setNewType] = useState('Call');
    const [newSummary, setNewSummary] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [nextFollowUp, setNextFollowUp] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Conversion Modal State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [convertData, setConvertData] = useState({
        taxId: '',
        industryCode: '01',
        invoiceAddress: '',
        factoryAddress: '',
        allocationRate: 0.15,
        avgDomesticWorkers: 0
    });

    useEffect(() => {
        fetchLead();
    }, [id]);

    // Recalculate Quota (using proper 3K5 formula)
    useEffect(() => {
        setSimQuota(calculate3K5Quota(simDomesticWorkers, simAllocationRate));
    }, [simDomesticWorkers, simAllocationRate]);

    const fetchLead = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}`);
            if (res.ok) {
                const data = await res.json();
                setLead(data);
                // Pre-fill conversion data
                setConvertData(prev => ({
                    ...prev,
                    invoiceAddress: data.address || '',
                    factoryAddress: data.address || '',
                    avgDomesticWorkers: simDomesticWorkers,
                    allocationRate: simAllocationRate
                }));
            } else {
                alert('Failed to load lead');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newType,
                    summary: newSummary,
                    detailedNotes: newNotes,
                    nextFollowUpDate: nextFollowUp || null
                })
            });

            if (res.ok) {
                // Refresh
                setNewSummary('');
                setNewNotes('');
                setNextFollowUp('');
                fetchLead();
            }
        } catch (error) {
            alert('Error adding interaction');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConvertSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (convertData.taxId.length !== 8) {
            alert("Tax ID must be exactly 8 digits.");
            return;
        }

        // Manufacturing-specific validation
        if (convertData.industryCode === '01') {
            if (!convertData.factoryAddress) {
                alert("Factory address is required for manufacturing employers.");
                return;
            }
            if (!convertData.avgDomesticWorkers || convertData.avgDomesticWorkers <= 0) {
                alert("Average domestic worker count is required for manufacturing employers.");
                return;
            }
        }

        try {
            const res = await fetch(`http://localhost:3001/api/leads/${id}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operatorId: 'CURRENT_USER_ID',
                    taxId: convertData.taxId,
                    industryCode: convertData.industryCode,
                    invoiceAddress: convertData.invoiceAddress,
                    factoryAddress: convertData.factoryAddress,
                    avgDomesticWorkers: convertData.avgDomesticWorkers,
                    allocationRate: convertData.allocationRate
                })
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/employers/${data.employer.id}`);
            } else {
                const err = await res.json();
                alert('Conversion failed: ' + err.error);
            }
        } catch (error) {
            alert('Conversion error');
        }
    };

    const handleMarkLost = async () => {
        const reason = prompt("Please enter reason for loss:");
        if (!reason) return;

        try {
            await fetch(`http://localhost:3001/api/leads/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'LOST' })
            });
            await fetch(`http://localhost:3001/api/leads/${id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'System',
                    summary: 'Marked as Lost',
                    detailedNotes: reason
                })
            });
            fetchLead();
        } catch (error) {
            console.error(error);
        }
    };

    // Zero Fee Check (based on industry code)
    const showZeroFeeWarning = (newNotes.toLowerCase().includes('indonesia') || newNotes.toLowerCase().includes('印尼')) &&
        (convertData.industryCode === '01');


    if (loading) return <div className="p-10">Loading...</div>;
    if (!lead) return <div className="p-10">Lead not found</div>;

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{lead.companyName || "Unnamed Lead"}</h1>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase font-bold">
                                {lead.status}
                            </span>
                            {lead.industry && <span className="text-sm text-slate-500">• {lead.industry}</span>}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {lead.status !== 'WON' && lead.status !== 'LOST' && (
                        <>
                            <button
                                onClick={() => setIsConvertModalOpen(true)}
                                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                            >
                                <CheckCircle size={18} /> 轉為正式客戶
                            </button>
                            <button
                                onClick={handleMarkLost}
                                className="flex items-center gap-2 bg-slate-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 border border-slate-200"
                            >
                                <XCircle size={18} /> 標記為流失
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Left: Info Pannel */}
                <div className="col-span-4 space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <User size={18} /> 聯絡資訊
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">聯絡人 (Contact Person)</label>
                                <div className="text-slate-800 font-medium">{lead.contactPerson || '-'}</div>
                                <div className="text-xs text-slate-500">{lead.jobTitle}</div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Phone size={16} className="text-slate-400 mt-1" />
                                <div>
                                    <div className="text-sm font-medium">{lead.mobile || '-'}</div>
                                    <div className="text-xs text-slate-500">{lead.phone || '-'}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail size={16} className="text-slate-400" />
                                <div className="text-sm">{lead.email || '-'}</div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin size={16} className="text-slate-400 mt-1" />
                                <div className="text-sm">{lead.address || '-'}</div>
                            </div>

                            <hr className="my-4" />

                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">下次追蹤日期</label>
                                <div className="text-slate-800 font-medium text-lg">
                                    {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : '未設定'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quota Simulation */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Calculator size={18} /> 3K5 配額試算
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">平均本勞人數 (Avg. Domestic Workers)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={simDomesticWorkers}
                                    onChange={(e) => setSimDomesticWorkers(Number(e.target.value))}
                                    placeholder="e.g. 125"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 block mb-1">核配比率 (Allocation Rate)</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    value={simAllocationRate}
                                    onChange={(e) => setSimAllocationRate(Number(e.target.value))}
                                >
                                    <option value={0.10}>10% (C級)</option>
                                    <option value={0.15}>15% (B級)</option>
                                    <option value={0.20}>20% (A級)</option>
                                    <option value={0.25}>25% (A+級)</option>
                                    <option value={0.35}>35% (最高)</option>
                                </select>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg text-center mt-2">
                                <span className="text-xs text-slate-500 uppercase block mb-1">預估配額 (Estimated Quota)</span>
                                <span className="text-3xl font-bold text-blue-600">{simQuota}</span>
                                <span className="text-sm text-slate-400 ml-1">人</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Activity Timeline */}
                <div className="col-span-8 space-y-6">
                    {/* Add Interaction Box */}
                    <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-4">紀錄活動 (Log Activity)</h3>
                        <form onSubmit={handleAddInteraction} className="space-y-3">
                            <div className="flex gap-4">
                                <select
                                    className="p-2 border border-slate-300 rounded-lg text-sm w-32"
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                >
                                    <option value="Call">電話聯繫 (Call)</option>
                                    <option value="Visit">現場拜訪 (Visit)</option>
                                    <option value="Email">電子郵件 (Email)</option>
                                    <option value="Line">LINE</option>
                                    <option value="Meeting">會議 (Meeting)</option>
                                </select>
                                <input
                                    type="text"
                                    placeholder="簡短摘要 (例如：討論報價)"
                                    className="flex-1 p-2 border border-slate-300 rounded-lg text-sm"
                                    value={newSummary}
                                    onChange={(e) => setNewSummary(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="relative">
                                <textarea
                                    placeholder="詳細記錄..."
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm h-24"
                                    value={newNotes}
                                    onChange={(e) => setNewNotes(e.target.value)}
                                />
                                {showZeroFeeWarning && (
                                    <div className="absolute bottom-2 left-2 right-2 bg-yellow-50 border border-yellow-200 p-2 rounded text-xs text-yellow-700 flex items-center gap-2">
                                        <AlertTriangle size={14} />
                                        提醒：針對印尼勞工及製造業，需留意零付費相關規定（雇主需負擔機票與簽證費）。
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <span>下次追蹤日期：</span>
                                    <input
                                        type="date"
                                        className="p-1 border border-slate-300 rounded"
                                        value={nextFollowUp}
                                        onChange={(e) => setNextFollowUp(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send size={14} /> 紀錄活動
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Timeline List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-500 uppercase text-xs">過去活動紀錄</h3>
                        {lead.interactions.length === 0 && (
                            <div className="text-center text-slate-400 py-10">尚無活動紀錄。</div>
                        )}
                        {lead.interactions.map(interaction => (
                            <div key={interaction.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${interaction.type === 'Call' ? 'bg-green-100 text-green-600' :
                                    interaction.type === 'Visit' ? 'bg-purple-100 text-purple-600' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                    {interaction.type === 'Call' ? <Phone size={18} /> :
                                        interaction.type === 'Visit' ? <MapPin size={18} /> :
                                            <Mail size={18} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800">{interaction.type} - {interaction.summary}</h4>
                                        <span className="text-xs text-slate-400">{new Date(interaction.date).toLocaleString()}</span>
                                    </div>
                                    {interaction.detailedNotes && (
                                        <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{interaction.detailedNotes}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Conversion Modal */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <FileText className="text-blue-600" /> 轉為正式客戶
                            </h2>
                            <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">公司名稱 (Company Name)</label>
                                <input
                                    type="text"
                                    value={lead.companyName || ''}
                                    disabled
                                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-slate-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 required">統一編號 (Tax ID)</label>
                                <input
                                    type="text"
                                    maxLength={8}
                                    required
                                    placeholder="例如：12345678"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={convertData.taxId}
                                    onChange={e => setConvertData({ ...convertData, taxId: e.target.value.replace(/\D/g, '') })}
                                />
                                <p className="text-xs text-slate-500 mt-1">必須為8碼。</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">產業別 (Industry Code) *</label>
                                <select
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={convertData.industryCode}
                                    onChange={e => setConvertData({ ...convertData, industryCode: e.target.value })}
                                    required
                                >
                                    <option value="01">01 製造業 (Manufacturing)</option>
                                    <option value="02">02 營造業 (Construction)</option>
                                    <option value="06">06 家庭看護 (Home Care)</option>
                                    <option value="08">08 機構看護 (Institution)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">標準行業代碼</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">公司登記地址 (Invoice Address) *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="輸入公司登記地址"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={convertData.invoiceAddress}
                                    onChange={e => setConvertData({ ...convertData, invoiceAddress: e.target.value })}
                                />
                            </div>

                            {convertData.industryCode === '01' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">工廠地址 (Factory Address) *</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="輸入工廠登記地址"
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={convertData.factoryAddress}
                                            onChange={e => setConvertData({ ...convertData, factoryAddress: e.target.value })}
                                        />
                                        <p className="text-xs text-slate-500 mt-1">需用於申請宿舍</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">勞保平均人數 (Avg Labor Count) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            placeholder="e.g. 125"
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={convertData.avgDomesticWorkers || simDomesticWorkers}
                                            onChange={e => setConvertData({ ...convertData, avgDomesticWorkers: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">核配比率 (Allocation Rate) *</label>
                                        <select
                                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={convertData.allocationRate}
                                            onChange={e => setConvertData({ ...convertData, allocationRate: Number(e.target.value) })}
                                            required
                                        >
                                            <option value={0.10}>10% (C級)</option>
                                            <option value={0.15}>15% (B級)</option>
                                            <option value={0.20}>20% (A級)</option>
                                            <option value={0.25}>25% (A+級)</option>
                                            <option value={0.35}>35% (最高)</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {convertData.industryCode === '01' && convertData.avgDomesticWorkers > 0 && convertData.allocationRate > 0 && (
                                <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 flex items-start gap-2">
                                    <Calculator size={16} className="mt-0.5" />
                                    <div>
                                        <strong>3K5 配額試算：</strong>
                                        <div className="text-xs opacity-80">
                                            {convertData.avgDomesticWorkers} × {convertData.allocationRate * 100}% = <b>{calculate3K5Quota(convertData.avgDomesticWorkers, convertData.allocationRate)}</b> 人
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsConvertModalOpen(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    取消 (Cancel)
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    確認轉換 (Confirm)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
