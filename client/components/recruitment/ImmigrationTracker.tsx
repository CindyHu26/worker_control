
"use client";

import React, { useState, useEffect } from 'react';
import { Save, FileCheck, Plane, Building2, Ticket } from 'lucide-react';
import HospitalSelector from '../health/HospitalSelector';

interface ImmigrationProcess {
    id: string;
    status: string;

    healthCheckHospitalId?: string;
    healthCheckDate?: string;
    healthCheckStatus?: string;
    healthCheckHospital?: { name: string; country: string };

    policeCode?: string;
    policeDate?: string;

    passportNo?: string;
    passportIssueDate?: string;
    passportExpiryDate?: string;
    passportSubmissionDate?: string;

    biometricDate?: string;
    trainingDate?: string;
    trainingCity?: string;

    estimatedEntryDate?: string;
    actualEntryDate?: string;
}

interface ImmigrationTrackerProps {
    workerId: string;
}

export default function ImmigrationTracker({ workerId }: ImmigrationTrackerProps) {
    const [data, setData] = useState<ImmigrationProcess | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState<Partial<ImmigrationProcess>>({});

    useEffect(() => {
        if (workerId) fetchProcess();
    }, [workerId]);

    const fetchProcess = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/immigration/${workerId}`);
            if (res.ok) {
                const json = await res.json();
                if (json) {
                    setData(json);
                    setFormData(json);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/immigration/${workerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                const updated = await res.json();
                setData(updated);
                setFormData(updated);
                alert('Saved successfully!');
            } else {
                alert('Failed to save');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving data');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof ImmigrationProcess, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (loading) return <div className="p-4 text-slate-500">Loading tracking info...</div>;

    const dateValue = (dateStr?: string) => dateStr ? dateStr.split('T')[0] : '';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Plane className="text-blue-600" /> 入境前追蹤 Inventory
                </h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Overseas Health Check */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Building2 size={18} className="text-teal-600" /> 海外體檢 (Overseas Check)
                    </h4>
                    <div className="space-y-4">
                        <div>
                            <HospitalSelector
                                label="體檢醫院 (Hospital)"
                                type="overseas"
                                value={formData.healthCheckHospital?.name || ''}
                                // TODO: HospitalSelector expects name string but usually we store ID.
                                // But here we might want to store/display name. 
                                // Actually API upsert logic expects healthCheckHospitalId. 
                                // Need to handle selection mapping properly.
                                // For now, let's assume HospitalSelector handles name search and we need to look up ID?
                                // Simplified: Store hospital name in state for selector, separate logic for ID?
                                // Wait, HospitalSelector `onChange` returns name.
                                // If I need ID, I might need to update HospitalSelector to return object.
                                // OR: Let's assume for this MVP we just need to ensure the user picks a valid one.
                                // But backend needs ID. 
                                // I will modify HospitalSelector to accept `onSelect` returning full object?
                                // Let's keep it simple: Use HospitalSelector as is, but logic to find ID?
                                // No, better to update HospitalSelector to support returning ID.
                                // I will revisit HospitalSelector in next step if needed. 
                                // For now, assuming I can just pass name? No, I need ID for relation.
                                // Let's pause and mark task to update HospitalSelector.
                                onSelect={(h) => {
                                    handleChange('healthCheckHospitalId', h.id);
                                    handleChange('healthCheckHospital', { name: h.name, country: h.country });
                                }}
                            />
                            {/* Wait, I can hack it by searching the list again or just update HospitalSelector. */}
                            {/* I will update HospitalSelector to accept onSelect callback with full object. */}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">檢查日期</label>
                                <input
                                    type="date"
                                    value={dateValue(formData.healthCheckDate)}
                                    onChange={e => handleChange('healthCheckDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">結果</label>
                                <select
                                    value={formData.healthCheckStatus || ''}
                                    onChange={e => handleChange('healthCheckStatus', e.target.value)}
                                    className="w-full border p-2 rounded"
                                >
                                    <option value="">--</option>
                                    <option value="PASS">合格 (Pass)</option>
                                    <option value="FAIL">不合格 (Fail)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Police Record & Passport */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileCheck size={18} className="text-indigo-600" /> 良民證 & 護照 (Police & Passport)
                    </h4>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">良民證號</label>
                                <input
                                    type="text"
                                    value={formData.policeCode || ''}
                                    onChange={e => handleChange('policeCode', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">簽發日期</label>
                                <input
                                    type="date"
                                    value={dateValue(formData.policeDate)}
                                    onChange={e => handleChange('policeDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">護照號碼</label>
                                <input
                                    type="text"
                                    value={formData.passportNo || ''}
                                    onChange={e => handleChange('passportNo', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">送件日期</label>
                                <input
                                    type="date"
                                    value={dateValue(formData.passportSubmissionDate)}
                                    onChange={e => handleChange('passportSubmissionDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">簽發日期</label>
                                <input
                                    type="date"
                                    value={dateValue(formData.passportIssueDate)}
                                    onChange={e => handleChange('passportIssueDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">到期日期</label>
                                <input
                                    type="date"
                                    value={dateValue(formData.passportExpiryDate)}
                                    onChange={e => handleChange('passportExpiryDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Training & Entry */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
                    <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Ticket size={18} className="text-orange-600" /> 行前備查 & 入境 (Pre-Departure)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">受訓 (Training)</label>
                            <input
                                type="date"
                                value={dateValue(formData.trainingDate)}
                                onChange={e => handleChange('trainingDate', e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="Training Date"
                            />
                            <input
                                type="text"
                                value={formData.trainingCity || ''}
                                onChange={e => handleChange('trainingCity', e.target.value)}
                                className="w-full border p-2 rounded"
                                placeholder="受訓城市 (City)"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">指紋 (Biometrics)</label>
                            <input
                                type="date"
                                value={dateValue(formData.biometricDate)}
                                onChange={e => handleChange('biometricDate', e.target.value)}
                                className="w-full border p-2 rounded"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">入境 (Entry)</label>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-slate-500">預計 (Estimated)</span>
                                <input
                                    type="date"
                                    value={dateValue(formData.estimatedEntryDate)}
                                    onChange={e => handleChange('estimatedEntryDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="text-xs text-slate-500">實際 (Actual)</span>
                                <input
                                    type="date"
                                    value={dateValue(formData.actualEntryDate)}
                                    onChange={e => handleChange('actualEntryDate', e.target.value)}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
