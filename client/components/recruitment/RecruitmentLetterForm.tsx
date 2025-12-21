import React, { useState } from 'react';
import { Calendar, Save, X, FileText } from 'lucide-react';
import AttachmentManager from '@/components/common/AttachmentManager';
import { format } from 'date-fns';

interface FormData {
    id?: string;
    letterNumber: string;
    submissionDate: string;
    issueDate: string;
    laborMinistryReceiptDate: string;
    expiryDate: string; // validUntil
    approvedQuota: number;
    workAddress: string;
    industrialBureauRef: string;
    recruitmentType: string;
    remarks: string;
    // New fields
    jobType?: string;
    industryCode?: string;
    projectCode?: string;
    issueUnit?: string;
    issueWord?: string;
    nationality?: string;
    quotaMale?: number;
    quotaFemale?: number;
    canCirculate: boolean;
}

interface Props {
    initialData?: Partial<FormData>;
    employerId: string;
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

export function RecruitmentLetterForm({ initialData, employerId, onSubmit, onCancel }: Props) {
    const [formData, setFormData] = useState<FormData>({
        id: initialData?.id,
        letterNumber: initialData?.letterNumber || '',
        submissionDate: initialData?.submissionDate ? initialData.submissionDate.split('T')[0] : '',
        issueDate: initialData?.issueDate ? initialData.issueDate.split('T')[0] : '',
        laborMinistryReceiptDate: initialData?.laborMinistryReceiptDate ? initialData.laborMinistryReceiptDate.split('T')[0] : '',
        expiryDate: initialData?.expiryDate ? initialData.expiryDate.split('T')[0] : '',
        approvedQuota: initialData?.approvedQuota || 0,
        workAddress: initialData?.workAddress || '',
        industrialBureauRef: initialData?.industrialBureauRef || '',
        recruitmentType: initialData?.recruitmentType || '初招',
        remarks: initialData?.remarks || '',
        jobType: initialData?.jobType || '',
        industryCode: initialData?.industryCode || '',
        projectCode: initialData?.projectCode || '',
        issueUnit: initialData?.issueUnit || '勞動部',
        issueWord: initialData?.issueWord || '勞動發事字',
        nationality: initialData?.nationality || '',
        quotaMale: initialData?.quotaMale || 0,
        quotaFemale: initialData?.quotaFemale || 0,
        canCirculate: initialData?.canCirculate !== undefined ? initialData.canCirculate : true
    });

    const isEditMode = !!formData.id;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <div className="bg-white p-6 border rounded-lg shadow-sm mt-4 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    {isEditMode ? '編輯招募函 (Edit Recruitment Letter)' : '登錄新招募函 (New Recruitment Letter)'}
                </h3>
                <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Critical Dates */}
                <div className="bg-blue-50 p-4 rounded-md grid grid-cols-1 md:grid-cols-3 gap-4 border border-blue-100">
                    <div>
                        <label className="block text-sm font-bold text-blue-900 mb-1">送件日期 (Submission Date)</label>
                        <input
                            type="date"
                            className="block w-full rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.submissionDate}
                            onChange={e => setFormData({ ...formData, submissionDate: e.target.value })}
                        />
                        <p className="text-xs text-blue-600 mt-1">※ 行政送件時填寫 (Fill when submitted)</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">勞動部收文日期 (Receipt Date)</label>
                        <input
                            type="date"
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.laborMinistryReceiptDate}
                            onChange={e => setFormData({ ...formData, laborMinistryReceiptDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">發文日期 (Issue Date)</label>
                        <input
                            type="date"
                            className="block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.issueDate}
                            onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                            required
                        />
                    </div>
                </div>

                {/* 2. Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">發文號 (Letter No)</label>
                        <input
                            type="text"
                            placeholder="例: 1091844611"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={formData.letterNumber}
                            onChange={e => setFormData({ ...formData, letterNumber: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">招募別 (Type)</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.recruitmentType}
                                onChange={e => setFormData({ ...formData, recruitmentType: e.target.value })}
                            >
                                <option value="初招">初招 (Initial)</option>
                                <option value="重招">重招 (Re-recruit)</option>
                                <option value="遞補">遞補 (Replacement)</option>
                                <option value="接續聘僱">接續聘僱 (Transfer)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700">國籍 (Nationality)</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                value={formData.nationality}
                                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                            >
                                <option value="">不限 (Any)</option>
                                <option value="ID">印尼 (ID)</option>
                                <option value="VN">越南 (VN)</option>
                                <option value="PH">菲律賓 (PH)</option>
                                <option value="TH">泰國 (TH)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">核准名額 (Quota)</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.approvedQuota}
                            onChange={e => setFormData({ ...formData, approvedQuota: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                </div>

                {/* 2.5 Gender Constraints & Circulation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">男性名額 (Male Quota)</label>
                        <input
                            type="number"
                            placeholder="選填 (Optional)"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.quotaMale || ''}
                            onChange={e => setFormData({ ...formData, quotaMale: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">女性名額 (Female Quota)</label>
                        <input
                            type="number"
                            placeholder="選填 (Optional)"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.quotaFemale || ''}
                            onChange={e => setFormData({ ...formData, quotaFemale: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                checked={formData.canCirculate}
                                onChange={e => setFormData({ ...formData, canCirculate: e.target.checked })}
                            />
                            <span className="text-sm font-medium text-gray-700">可循環使用 (Circulation)</span>
                        </label>
                    </div>
                </div>

                {/* 3. Detailed Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">引用工業局文號 (Bureau Ref)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.industrialBureauRef}
                            onChange={e => setFormData({ ...formData, industrialBureauRef: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">招募效期 (Expiry Date)</label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.expiryDate}
                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">工作地點 (Work Address)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.workAddress}
                            onChange={e => setFormData({ ...formData, workAddress: e.target.value })}
                            placeholder="例: 彰化縣鹿港鎮..."
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">備註說明 (Remarks)</label>
                        <textarea
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            rows={3}
                            value={formData.remarks}
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                        />
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
                        取消 (Cancel)
                    </button>
                    <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded shadow-sm">
                        <Save size={18} />
                        儲存招募函 (Save Letter)
                    </button>
                </div>
            </form>

            {/* 4. Attachment Manager (Edit Mode Only) */}
            {isEditMode && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FileText size={20} />
                        函件檔案上傳 (Attachments)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <AttachmentManager
                            refId={formData.id!}
                            refTable="employer_recruitment_letters"
                            allowUpload={true}
                        />
                    </div>
                </div>
            )}
            {!isEditMode && (
                <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 text-sm rounded border border-yellow-200 text-center">
                    請先儲存基本資料，即可開始上傳掃描檔。 (Save first to upload files)
                </div>
            )}
        </div>
    );
}