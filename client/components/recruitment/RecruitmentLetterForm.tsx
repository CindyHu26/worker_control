import React, { useState } from 'react';

export function RecruitmentLetterForm({ jobOrder, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        permitNo: '',
        issueDate: '',
        validUntil: '',
        approvedQuota: jobOrder ? jobOrder.vacancy : 0, // 預設帶入求才人數
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="bg-white p-6 border rounded-lg shadow-sm mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                2. 登錄勞動部招募函
                {jobOrder && <span className="text-sm text-gray-500 ml-2">(依據：{jobOrder.certNo})</span>}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">發文號 (Permit No)</label>
                        <input
                            type="text"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="勞動發事字第..."
                            value={formData.permitNo}
                            onChange={e => setFormData({ ...formData, permitNo: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">核准名額 (Quota)</label>
                        <input
                            type="number"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            value={formData.approvedQuota}
                            onChange={e => setFormData({ ...formData, approvedQuota: parseInt(e.target.value) })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">發文日期 (Issue Date)</label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.issueDate}
                            onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">有效期限 (Valid Until)</label>
                        <input
                            type="date"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            value={formData.validUntil}
                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">通常為發文日 + 1年</p>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">取消</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded">確認登錄並產生額度</button>
                </div>
            </form>
        </div>
    );
}