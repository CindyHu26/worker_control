"use client";

import React, { useState } from 'react';
import { X, Calendar, FileText, MapPin } from 'lucide-react';
import HospitalSelector from './HospitalSelector';

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    check: any;
}

export default function ResultModal({ isOpen, onClose, onSave, check }: ResultModalProps) {
    const [result, setResult] = useState(check?.result || 'pending');
    const [hospital, setHospital] = useState(check?.hospitalName || '');
    const [reportDate, setReportDate] = useState(check?.reportDate?.split('T')[0] || '');
    const [approvalDocNo, setApprovalDocNo] = useState(check?.approvalDocNo || '');
    const [failReason, setFailReason] = useState(check?.failReason || '');

    const [createRecheck, setCreateRecheck] = useState(true);
    const [recheckDeadline, setRecheckDeadline] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            result,
            hospitalName: hospital,
            reportDate,
            approvalDocNo,
            failReason,
            createRecheck: (result === 'fail' || result === 'needs_recheck') ? createRecheck : false,
            recheckDeadline: (result === 'fail' || result === 'needs_recheck') ? recheckDeadline : undefined
        });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-900">更新體檢結果 (Update Result)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">體檢結果</label>
                        <select
                            value={result}
                            onChange={e => setResult(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="pending">未完成 (Pending)</option>
                            <option value="pass">合格 (Pass)</option>
                            <option value="fail">不合格 (Fail)</option>
                            <option value="needs_recheck">需複檢 (Needs Re-check)</option>
                        </select>
                    </div>

                    <div>
                        <HospitalSelector
                            value={hospital}
                            onChange={setHospital}
                            type={check?.checkType === 'xray' ? 'xray' : 'general'} // Assume check has checkType
                            label="檢查醫院 (Hospital)"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">報告日期 (Date)</label>
                        <input
                            type="date"
                            value={reportDate}
                            onChange={e => setReportDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                        />
                    </div>

                    {(result === 'pass' || result === 'completed') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">核備文號 (Approval Doc No)</label>
                            <input
                                type="text"
                                value={approvalDocNo} // TODO: Update schema to ensure field exists or reuse another
                                onChange={e => setApprovalDocNo(e.target.value)}
                                placeholder="ex. 府衛疾字第123456號"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">登錄衛生局核備函文號。</p>
                        </div>
                    )}

                    {(result === 'fail' || result === 'needs_recheck') && (
                        <div className="bg-red-50 p-4 rounded-lg space-y-3 border border-red-100">
                            <h4 className="text-sm font-bold text-red-800 flex items-center gap-1">
                                <FileText size={16} /> 異常處理程序
                            </h4>

                            <div>
                                <label className="block text-xs font-medium text-red-700 mb-1">異常原因 (Reason)</label>
                                <input
                                    type="text"
                                    value={failReason}
                                    onChange={e => setFailReason(e.target.value)}
                                    placeholder="ex. 寄生蟲、肺部陰影..."
                                    className="w-full border border-red-200 rounded px-2 py-1.5 text-sm outline-none focus:border-red-400"
                                />
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={createRecheck}
                                    onChange={e => setCreateRecheck(e.target.checked)}
                                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm text-red-700 font-medium">建立複檢追蹤任務 (Create Re-check Task)</span>
                            </label>

                            {createRecheck && (
                                <div>
                                    <label className="block text-xs font-medium text-red-700 mb-1">複檢期限 (Deadline)</label>
                                    <input
                                        type="date"
                                        value={recheckDeadline}
                                        onChange={e => setRecheckDeadline(e.target.value)}
                                        className="w-full border border-red-200 rounded px-2 py-1.5 text-sm outline-none focus:border-red-400"
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        >
                            儲存更新
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
