import { useState, useEffect } from 'react';
import { Briefcase, Save, X, FileText, Calendar, AlertCircle } from 'lucide-react';

interface JobTabProps {
    worker: any;
    currentDeployment: any;
    onUpdate: (data: any) => Promise<void>;
}

export default function JobTab({ worker, currentDeployment, onUpdate }: JobTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Flat structure for form data to map to API body
        if (currentDeployment) {
            setFormData({
                // Worker Fields
                oldPassportNumber: worker.oldPassportNumber,
                passportNumber: worker.passports?.[0]?.passportNumber,
                // Note: Updating passport number via this endpoint is not fully supported in my backend change yet (requires checking if new passport entry needed vs update). 
                // I added logic to backend to update Worker fields, but passport is a separate model. 
                // "Handle Decimal values..." -> My backend change handled standard fields. 
                // I will add read-only for now for passport list, or simple field for current.

                // Deployment Fields
                visaLetterNo: currentDeployment.visaLetterNo,
                visaLetterDate: currentDeployment.visaLetterDate ? new Date(currentDeployment.visaLetterDate).toISOString().split('T')[0] : '',
                entryReportDocNo: currentDeployment.entryReportDocNo,
                entryReportDate: currentDeployment.entryReportDate ? new Date(currentDeployment.entryReportDate).toISOString().split('T')[0] : '',
                recruitmentLetterNo: currentDeployment.recruitmentLetter?.letterNumber || '', // Read only mostly

                terminationPermitNo: currentDeployment.terminationPermitNo,
                terminationPermitDate: currentDeployment.terminationPermitDate ? new Date(currentDeployment.terminationPermitDate).toISOString().split('T')[0] : '',

                runawayReportDocNo: currentDeployment.runawayReportDocNo,
                runawayReportDate: currentDeployment.runawayReportDate ? new Date(currentDeployment.runawayReportDate).toISOString().split('T')[0] : '',
            });
        }
    }, [worker, currentDeployment]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onUpdate(formData);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert('更新失敗');
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate Remaining Days
    const calculateRemainingDays = () => {
        if (!currentDeployment?.endDate) return '-';
        const end = new Date(currentDeployment.endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? `${diffDays} 天` : '已到期';
    };

    // Calculate Duration in Taiwan
    const calculateDuration = () => {
        if (!currentDeployment?.entryDate) return '-';
        const start = new Date(currentDeployment.entryDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const years = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        const days = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
        return `${years} 年 ${days} 天`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <Briefcase className="text-blue-600" /> 聘僱與證件 (Job & Permits)
                </h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded border hover:bg-slate-50 flex items-center gap-2">
                                <X size={16} /> 取消
                            </button>
                            <button onClick={handleSave} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 font-bold shadow-sm">
                                <Save size={16} /> 儲存變更
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium shadow-sm transition">
                            編輯資料 (Edit)
                        </button>
                    )}
                </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded border border-blue-100">
                    <span className="block text-xs font-bold text-blue-800 uppercase">剩餘聘僱天數 (Remaining)</span>
                    <span className="text-2xl font-bold text-blue-900">{calculateRemainingDays()}</span>
                </div>
                <div className="bg-green-50 p-4 rounded border border-green-100">
                    <span className="block text-xs font-bold text-green-800 uppercase">來台年限 (Duration)</span>
                    <span className="text-2xl font-bold text-green-900">{calculateDuration()}</span>
                </div>
                <div className="bg-purple-50 p-4 rounded border border-purple-100">
                    <span className="block text-xs font-bold text-purple-800 uppercase">目前狀態 (Status)</span>
                    <span className="text-2xl font-bold text-purple-900">{currentDeployment?.status || '-'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Official Docs IDs */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2">證件號碼 (Official IDs)</h4>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">護照號碼 (Passport No.)</label>
                            <div className="text-lg font-mono font-bold text-slate-800 bg-slate-50 p-2 rounded flex justify-between items-center">
                                {worker.passports?.[0]?.passportNumber || '無資料'}
                                <span className="text-[10px] text-slate-400 font-normal">Latest</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">舊護照號碼 (Old Passport)</label>
                            {isEditing ? (
                                <input
                                    name="oldPassportNumber"
                                    value={formData.oldPassportNumber || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 font-mono">{worker.oldPassportNumber || '-'}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">居留證號 (ARC No.)</label>
                            <div className="text-lg font-mono font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-200">
                                {worker.arcs?.[0]?.arcNumber || '無資料'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permit Numbers */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2">函文與許可 (Permits)</h4>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">簽證函號 (Visa Letter)</label>
                                {isEditing ? (
                                    <input
                                        name="visaLetterNo"
                                        value={formData.visaLetterNo || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base font-mono">{currentDeployment?.visaLetterNo || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">簽證函日期</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="visaLetterDate"
                                        value={formData.visaLetterDate || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base">{currentDeployment?.visaLetterDate ? new Date(currentDeployment.visaLetterDate).toLocaleDateString() : '-'}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">入國通報案號 (Entry Report)</label>
                                {isEditing ? (
                                    <input
                                        name="entryReportDocNo"
                                        value={formData.entryReportDocNo || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base font-mono">{currentDeployment?.entryReportDocNo || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">通報日期</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="entryReportDate"
                                        value={formData.entryReportDate || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base">{currentDeployment?.entryReportDate ? new Date(currentDeployment.entryReportDate).toLocaleDateString() : '-'}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">招募函號 (Recruitment Letter)</label>
                            <p className="text-base font-mono text-slate-600">{currentDeployment?.recruitmentLetter?.letterNumber || '無資料 (Link to Recruitment)'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
