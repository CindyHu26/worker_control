"use client";

import { useState, useEffect } from 'react';
import AttachmentManager from '../common/AttachmentManager';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
}

interface JobOrderFormProps {
    onSuccess: () => void;
}

export default function JobOrderForm({ onSuccess }: JobOrderFormProps) {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [formData, setFormData] = useState({
        employerId: '',
        recruitmentType: 'INITIAL', // INITIAL, RECRUIT, SUPPLEMENTARY
        letterNumber: '',
        issueDate: '',
        validUntil: '',
        quota: 1,
        countryCode: '',
        workTitleCode: '',
        parentJobOrderId: '', // For SUPPLEMENTARY

        // Legacy/Other
        vacancyCount: 1, // Will sync with quota
        orderDate: new Date().toISOString().split('T')[0],
        jobType: 'FACTORY_WORKER',

        // Attributes
        attributes: {} as any
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createdJobOrderId, setCreatedJobOrderId] = useState<string | null>(null);

    useEffect(() => {
        // Fetch employers for dropdown
        fetch('http://localhost:3001/api/recruitment/employers/list')
            .then(res => res.json())
            .then(data => setEmployers(data))
            .catch(err => console.error('Failed to load employers', err));
    }, []);

    // Auto-calculate Valid Until based on Issue Date
    useEffect(() => {
        if (formData.issueDate) {
            const issue = new Date(formData.issueDate);
            // Default logic: Usually +6 months for recruitment letter validity? 
            // Or use the 2023-06-01 rule mentioned in legacy code?
            // "依據 112/6/1 新制，招募期間已縮短為 7 日" refers to local recruitment deadline, not the letter validity.
            // Letter validity is typically 6 months or 1 year. Let's assume 6 months default.
            const valid = new Date(issue);
            valid.setMonth(valid.getMonth() + 6);
            setFormData(prev => ({
                ...prev,
                validUntil: valid.toISOString().split('T')[0]
            }));
        }
    }, [formData.issueDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                quota: formData.quota,
                requiredCount: formData.quota, // Sync
            };

            const res = await fetch('http://localhost:3001/api/recruitment/job-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setCreatedJobOrderId(data.id);
                // Don't call onSuccess immediately if we want to allow attachment upload
                if (!confirm("Job Order Created! Do you want to upload attachments now?")) {
                    onSuccess();
                }
            } else {
                alert('Failed to create Job Order');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating Job Order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (createdJobOrderId) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">上傳招募函 (Upload Recruitment Letter)</h3>
                <div className="mb-4">
                    <p className="text-green-600 mb-2">Job Order Created Successfully!</p>
                    <AttachmentManager
                        refId={createdJobOrderId}
                        refTable="job_orders"
                        onUploadComplete={() => { }}
                    />
                </div>
                <button
                    onClick={() => {
                        setCreatedJobOrderId(null);
                        onSuccess();
                    }}
                    className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                >
                    Done / Return to List
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">新增招募許可函 (New Recruitment Letter)</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Row 1: Employer & Basic Identity */}
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">雇主名稱 (Employer)</label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.employerId}
                        onChange={e => setFormData({ ...formData, employerId: e.target.value })}
                        required
                    >
                        <option value="">請選擇雇主...</option>
                        {employers.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.companyName} ({emp.taxId})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">招募函號 (Letter No.)</label>
                    <input
                        type="text"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.letterNumber}
                        onChange={e => setFormData({ ...formData, letterNumber: e.target.value })}
                        required
                        placeholder="e.g. 勞動發事字第..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">招募類別 (Type)</label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.recruitmentType}
                        onChange={e => setFormData({ ...formData, recruitmentType: e.target.value })}
                        required
                    >
                        <option value="INITIAL">初次招募 (Initial)</option>
                        <option value="RECRUIT">重新招募 (Re-recruit)</option>
                        <option value="SUPPLEMENTARY">遞補招募 (Supplementary)</option>
                    </select>
                </div>

                {/* Supplementary Logic */}
                {formData.recruitmentType === 'SUPPLEMENTARY' && (
                    <div className="md:col-span-3 bg-blue-50 p-3 rounded-md border border-blue-100">
                        <label className="block text-sm font-medium text-gray-700 mb-1">原招募函 (Parent Letter)</label>
                        <select
                            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                            value={formData.parentJobOrderId}
                            onChange={e => setFormData({ ...formData, parentJobOrderId: e.target.value })}
                        >
                            <option value="">選擇原函 (關聯遞補對象)...</option>
                            {/* In real app, fetch employer's other letters */}
                        </select>
                        <p className="text-xs text-blue-600 mt-1">遞補函需關聯原許可函以追蹤名額流向</p>
                    </div>
                )}

                {/* Row 2: Dates & Quota */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">發文日期 (Issue Date)</label>
                    <input
                        type="date"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.issueDate}
                        onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">有效期限 (Valid Until)</label>
                    <input
                        type="date"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.validUntil}
                        onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">核准名額 (Quota)</label>
                    <input
                        type="number"
                        min="1"
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.quota}
                        onChange={e => setFormData({ ...formData, quota: parseInt(e.target.value) })}
                        required
                    />
                </div>

                {/* Row 3: Constraints */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">國別限制 (Country)</label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.countryCode}
                        onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                    >
                        <option value="">不限 (Any)</option>
                        <option value="IDN">印尼 (Indonesia)</option>
                        <option value="PHL">菲律賓 (Philippines)</option>
                        <option value="VNM">越南 (Vietnam)</option>
                        <option value="THA">泰國 (Thailand)</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">職候類別 (Work Title)</label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={formData.jobType}
                        onChange={e => setFormData({ ...formData, jobType: e.target.value })}
                    >
                        <option value="FACTORY_WORKER">製造業 (Factory)</option>
                        <option value="CARETAKER">看護工 (Caretaker)</option>
                        <option value="DOMESTIC_HELPER">幫傭 (Helper)</option>
                        <option value="CONSTRUCTION">營造業 (Construction)</option>
                        <option value="AGRICULTURE">農業 (Agriculture)</option>
                    </select>
                </div>

                <div className="md:col-span-3 flex justify-end mt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? '處理中...' : '新增許可函'}
                    </button>
                </div>
            </form>
        </div>
    );
}
