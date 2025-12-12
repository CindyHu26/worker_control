"use client";
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function GovtTabContent({ worker, currentDeployment }: { worker: any, currentDeployment: any }) {
    // Local state for form fields to generic "deployment" update
    const [form, setForm] = useState({
        entryReportDocNo: currentDeployment?.entryReportDocNo || '',
        entryReportDate: currentDeployment?.entryReportDate ? new Date(currentDeployment.entryReportDate).toISOString().split('T')[0] : '',
        runawayReportDocNo: currentDeployment?.runawayReportDocNo || '',
        runawayReportDate: currentDeployment?.runawayReportDate ? new Date(currentDeployment.runawayReportDate).toISOString().split('T')[0] : '',
        terminationPermitNo: currentDeployment?.terminationPermitNo || '',
        terminationPermitDate: currentDeployment?.terminationPermitDate ? new Date(currentDeployment.terminationPermitDate).toISOString().split('T')[0] : ''
    });

    const [healthChecks, setHealthChecks] = useState(worker.healthChecks || []);
    const [saving, setSaving] = useState(false);

    const handleDeploymentSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:3001/api/workers/${worker.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) alert('行政資料已更新');
            else alert('更新失敗');
        } catch (e) {
            console.error(e);
            alert('系統錯誤');
        } finally {
            setSaving(false);
        }
    };

    const handleHealthUpdate = async (hcId: string, field: string, value: any) => {
        try {
            // Optimistic update
            setHealthChecks((prev: any[]) => prev.map((h: any) => h.id === hcId ? { ...h, [field]: value } : h));

            await fetch(`http://localhost:3001/api/health-checks/${hcId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });
        } catch (e) {
            console.error(e);
            alert('更新體檢資料失敗');
        }
    };

    return (
        <div className="space-y-8">
            {/* Group 1: Entry & Reporting */}
            <section>
                <h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-700">1. 入國通報與入境 (Entry Reporting)</h3>
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded border border-slate-200">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-600">入國通報受理號碼 (Entry Report No)</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.entryReportDocNo}
                            onChange={e => setForm({ ...form, entryReportDocNo: e.target.value })}
                            placeholder="e.g. 112-0012345"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-600">入國通報日期 (Report Date)</label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            value={form.entryReportDate}
                            onChange={e => setForm({ ...form, entryReportDate: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* Group 2: Health Checks */}
            <section>
                <h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-700">2. 衛政追蹤 (Health Dept Tracking)</h3>
                <div className="overflow-x-auto border rounded-lg shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600">
                            <tr>
                                <th className="p-3">類別 (Type)</th>
                                <th className="p-3">檢查日期 (Date)</th>
                                <th className="p-3">結果 (Result)</th>
                                <th className="p-3 w-1/3">核備函號 (Approval Doc No)</th>
                                <th className="p-3">複檢狀態 (Re-check)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {healthChecks.length === 0 ? (
                                <tr><td colSpan={5} className="p-4 text-center text-slate-400">無體檢紀錄</td></tr>
                            ) : healthChecks.map((hc: any) => (
                                <tr key={hc.id} className="border-t hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-700">
                                        {hc.checkType === 'entry' && '入國後3日'}
                                        {hc.checkType === '6mo' && '入國後6月'}
                                        {hc.checkType === '18mo' && '入國後18月'}
                                        {hc.checkType === '30mo' && '入國後30月'}
                                        {!['entry', '6mo', '18mo', '30mo'].includes(hc.checkType) && hc.checkType}
                                    </td>
                                    <td className="p-3">{new Date(hc.checkDate).toLocaleDateString()}</td>
                                    <td className="p-3">
                                        {hc.result === 'pass' ?
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">合格</span> :
                                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">不合格</span>
                                        }
                                    </td>
                                    <td className="p-3">
                                        <input
                                            type="text"
                                            className="w-full border p-1 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={hc.approvalDocNo || ''}
                                            onChange={e => handleHealthUpdate(hc.id, 'approvalDocNo', e.target.value)}
                                            placeholder="輸入函號..."
                                        />
                                    </td>
                                    <td className="p-3">
                                        {hc.isRecheckRequired ? (
                                            <span className="text-red-600 font-bold text-xs flex items-center gap-1">
                                                ⚠️ 需複檢
                                                <input
                                                    type="checkbox"
                                                    checked={!hc.isRecheckRequired}
                                                    onChange={() => handleHealthUpdate(hc.id, 'isRecheckRequired', false)} // Allow manual clear
                                                    className="ml-2 accent-green-600 cursor-pointer"
                                                    title="標記為已完成"
                                                />
                                            </span>
                                        ) : <span className="text-slate-400">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Group 3: Termination */}
            <section>
                <h3 className="font-bold text-lg mb-4 border-b pb-2 text-slate-700">3. 離職與異常通報 (Termination Reporting)</h3>
                <div className="grid grid-cols-2 gap-6 bg-red-50 p-4 rounded border border-red-100">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-red-800">逃跑報備函號 (Runaway No)</label>
                        <input
                            type="text"
                            className="w-full border border-red-200 p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                            value={form.runawayReportDocNo}
                            onChange={e => setForm({ ...form, runawayReportDocNo: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-red-800">廢聘函號 (Termination Permit No)</label>
                        <input
                            type="text"
                            className="w-full border border-red-200 p-2 rounded focus:ring-2 focus:ring-red-500 outline-none"
                            value={form.terminationPermitNo}
                            onChange={e => setForm({ ...form, terminationPermitNo: e.target.value })}
                        />
                    </div>
                </div>
            </section>

            {/* Save Button for Forms */}
            <div className="fixed bottom-8 right-8">
                <button
                    onClick={handleDeploymentSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-700 text-white px-6 py-4 rounded-full shadow-xl hover:bg-blue-800 transition font-bold"
                >
                    <Save /> {saving ? '儲存中...' : '儲存變更 (Save Changes)'}
                </button>
            </div>

            {/* Spacer for fixed button */}
            <div className="h-20"></div>
        </div>
    );
}
