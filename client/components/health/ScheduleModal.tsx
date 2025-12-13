"use client";

import React, { useState } from 'react';
import { AUTHORIZED_HOSPITALS } from '@/constants/hospitals';
import { X, Calendar, MapPin } from 'lucide-react';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { hospitalName: string; checkDate: string }) => void;
    check: any;
}

export default function ScheduleModal({ isOpen, onClose, onSave, check }: ScheduleModalProps) {
    const [hospital, setHospital] = useState(check?.hospitalName || '');
    const [date, setDate] = useState(check?.checkDate?.split('T')[0] || '');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple validation: date must not be in the past (optional, depending on use case)
        // For now, checks are strict on deadline but lenient on scheduling.
        if (!hospital || !date) {
            setError('請選擇醫院與日期');
            return;
        }

        onSave({ hospitalName: hospital, checkDate: date });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-900">安排體檢 (Schedule Check)</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">移工姓名</label>
                        <div className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded border border-slate-200">
                            {check?.worker?.englishName}
                            <span className="text-slate-500 ml-2 text-sm">{check?.worker?.chineseName}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <span className="flex items-center gap-1"><MapPin size={16} /> 選擇指定醫院</span>
                        </label>
                        <select
                            value={hospital}
                            onChange={e => setHospital(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        >
                            <option value="">-- 請選擇 --</option>
                            {AUTHORIZED_HOSPITALS.map(h => (
                                <option key={h.id} value={h.name}>
                                    {h.name} ({h.region})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            <span className="flex items-center gap-1"><Calendar size={16} /> 預約日期</span>
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            請確保日期在應檢期限內。
                        </p>
                    </div>

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
                            確認安排
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
