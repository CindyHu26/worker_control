"use client";

import { useState, useEffect } from 'react';
import { Plane, FileText, Upload, Download, CheckCircle, AlertCircle, Calendar, Building, Shield, Heart, FileCheck } from 'lucide-react';

interface EntryDocsTabProps {
    worker: any;
    onUpdate?: () => void;
}

interface DocumentType {
    code: string;
    label: string;
    labelEn: string;
}

export default function EntryDocsTab({ worker, onUpdate }: EntryDocsTabProps) {
    const [entryFiling, setEntryFiling] = useState<any>(worker.entryFiling || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

    // Form state for entry filing
    const [form, setForm] = useState({
        entryDate: entryFiling?.entryDate?.split('T')[0] || '',
        flightNo: entryFiling?.flightNo || '',
        visaNo: entryFiling?.visaNo || '',
        overseasMedicalDate: entryFiling?.overseasMedicalDate?.split('T')[0] || '',
        overseasMedicalHospital: entryFiling?.overseasMedicalHospital || '',
        policeClearanceReceived: entryFiling?.policeClearanceReceived || false,
        policeClearanceDate: entryFiling?.policeClearanceDate?.split('T')[0] || '',
        laborInsuranceDate: entryFiling?.laborInsuranceDate?.split('T')[0] || '',
        healthInsuranceDate: entryFiling?.healthInsuranceDate?.split('T')[0] || '',
        airportCareRegistered: entryFiling?.airportCareRegistered || false,
        notes: entryFiling?.notes || '',
    });

    useEffect(() => {
        // Fetch document template types
        fetch('http://localhost:3001/api/reference-data?category=DOCUMENT_TEMPLATE_TYPE')
            .then(res => res.json())
            .then(data => setDocumentTypes(Array.isArray(data) ? data : []))
            .catch(console.error);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}/entry-filing`, {
                method: entryFiling ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                const updated = await res.json();
                setEntryFiling(updated);
                onUpdate?.();
            } else {
                alert('儲存失敗 (Save Failed)');
            }
        } catch (e) {
            console.error(e);
            alert('儲存失敗 (Save Failed)');
        } finally {
            setIsSaving(false);
        }
    };

    const getDocIcon = (code: string) => {
        switch (code) {
            case 'DOC_ENTRY_NOTIFICATION': return <Plane className="text-blue-500" size={20} />;
            case 'DOC_RESIDENCE_PERMIT_APP': return <FileCheck className="text-green-500" size={20} />;
            case 'DOC_EMPLOYMENT_PERMIT_APP': return <FileText className="text-purple-500" size={20} />;
            case 'DOC_LABOR_INSURANCE_ADD': return <Shield className="text-orange-500" size={20} />;
            case 'DOC_HEALTH_INSURANCE_ADD': return <Heart className="text-red-500" size={20} />;
            case 'DOC_AIRPORT_CARE': return <Building className="text-cyan-500" size={20} />;
            default: return <FileText className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side: Data Entry Form */}
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <Plane size={20} />
                        入境資料 (Entry Information)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">入境日期 *</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={form.entryDate}
                                onChange={e => setForm({ ...form, entryDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">班機號碼</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="e.g. CI-123"
                                value={form.flightNo}
                                onChange={e => setForm({ ...form, flightNo: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">簽證號碼</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Visa Number"
                                value={form.visaNo}
                                onChange={e => setForm({ ...form, visaNo: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-3 bg-white p-3 rounded-lg border">
                            <input
                                type="checkbox"
                                id="airportCare"
                                className="w-5 h-5 text-blue-600 rounded"
                                checked={form.airportCareRegistered}
                                onChange={e => setForm({ ...form, airportCareRegistered: e.target.checked })}
                            />
                            <label htmlFor="airportCare" className="text-sm font-medium text-gray-700">
                                已登記機場關懷服務 (Airport Care Registered)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-100">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                        <Calendar size={20} />
                        國外準備 (Overseas Preparation)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">國外體檢日期</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                value={form.overseasMedicalDate}
                                onChange={e => setForm({ ...form, overseasMedicalDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">體檢醫院</label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                placeholder="Hospital Name"
                                value={form.overseasMedicalHospital}
                                onChange={e => setForm({ ...form, overseasMedicalHospital: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-3 bg-white p-3 rounded-lg border">
                            <input
                                type="checkbox"
                                id="policeClearance"
                                className="w-5 h-5 text-green-600 rounded"
                                checked={form.policeClearanceReceived}
                                onChange={e => setForm({ ...form, policeClearanceReceived: e.target.checked })}
                            />
                            <label htmlFor="policeClearance" className="text-sm font-medium text-gray-700">
                                良民證已取得 (Police Clearance Received)
                            </label>
                        </div>
                        {form.policeClearanceReceived && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">取得日期</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    value={form.policeClearanceDate}
                                    onChange={e => setForm({ ...form, policeClearanceDate: e.target.value })}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100">
                    <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                        <Shield size={20} />
                        保險登記 (Insurance Registration)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">勞保加保日</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                value={form.laborInsuranceDate}
                                onChange={e => setForm({ ...form, laborInsuranceDate: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">健保加保日</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                value={form.healthInsuranceDate}
                                onChange={e => setForm({ ...form, healthInsuranceDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">備註 (Notes)</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-2.5 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional notes..."
                        value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving || !form.entryDate}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <CheckCircle size={20} />
                    )}
                    {isSaving ? '儲存中...' : '儲存入境資料'}
                </button>
            </div>

            {/* Right Side: Document Generation Panel */}
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        文件產生 (Document Generation)
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        選擇下列文件類型以產生或上傳範本。系統將自動填入移工及雇主資料。
                    </p>

                    {documentTypes.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <AlertCircle size={40} className="mx-auto mb-2 opacity-50" />
                            <p>尚未載入文件類型，請確認種子資料已執行。</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documentTypes.map((docType) => (
                                <div
                                    key={docType.code}
                                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        {getDocIcon(docType.code)}
                                        <div>
                                            <p className="font-medium text-slate-800">{docType.label}</p>
                                            <p className="text-xs text-slate-400">{docType.labelEn}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                                            title="Upload Template"
                                        >
                                            <Upload size={14} />
                                            上傳範本
                                        </button>
                                        <button
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                                            title="Generate Document"
                                            disabled={!entryFiling}
                                        >
                                            <Download size={14} />
                                            產生文件
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Status Indicator */}
                <div className={`p-4 rounded-lg border ${entryFiling ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                        {entryFiling ? (
                            <>
                                <CheckCircle className="text-green-600" size={20} />
                                <span className="font-medium text-green-800">入境資料已建立</span>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="text-yellow-600" size={20} />
                                <span className="font-medium text-yellow-800">尚未建立入境資料，請先填寫左側表單</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
