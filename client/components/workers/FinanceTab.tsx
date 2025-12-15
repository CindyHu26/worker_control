import { useState, useEffect } from 'react';
import { CreditCard, Save, X, DollarSign, Building } from 'lucide-react';
import FeeScheduleTable from './FeeScheduleTable';
import PayrollList from './PayrollList';

interface FinanceTabProps {
    worker: any;
    onUpdate: (data: any) => Promise<void>;
}

export default function FinanceTab({ worker, onUpdate }: FinanceTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...worker });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setFormData({ ...worker });
    }, [worker]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        // Handle checkbox for boolean
        if (type === 'checkbox') {
            setFormData((prev: any) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData((prev: any) => ({ ...prev, [name]: value }));
        }
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <DollarSign className="text-blue-600" /> 財務管理 (Finance)
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bank Account */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2 flex items-center gap-2">
                        <Building size={16} /> 銀行帳戶 (Bank Account)
                    </h4>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">銀行代號 (Bank Code)</label>
                                {isEditing ? (
                                    <input
                                        name="bankCode"
                                        value={formData.bankCode || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                        placeholder="e.g. 004"
                                    />
                                ) : (
                                    <p className="text-lg font-mono font-bold text-slate-800">{formData.bankCode || '-'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">分行名稱 (Branch Name)</label>
                                {isEditing ? (
                                    <input
                                        name="bankBranchName"
                                        value={formData.bankBranchName || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base text-slate-800">{formData.bankBranchName || '-'}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">帳號 (Account No.)</label>
                            {isEditing ? (
                                <input
                                    name="bankAccountNo"
                                    value={formData.bankAccountNo || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded font-mono"
                                />
                            ) : (
                                <p className="text-xl font-mono text-slate-800 tracking-wider">{formData.bankAccountNo || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">戶名 (Account Name)</label>
                            {isEditing ? (
                                <input
                                    name="bankAccountHolder"
                                    value={formData.bankAccountHolder || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded"
                                />
                            ) : (
                                <p className="text-base text-slate-800">{formData.bankAccountHolder || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loans & Tax */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2">貸款與稅務 (Loan & Tax)</h4>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded border border-red-100">
                            <div>
                                <label className="block text-xs font-semibold text-red-800 mb-1">貸款銀行 (Loan Bank)</label>
                                {isEditing ? (
                                    <input
                                        name="loanBank"
                                        value={formData.loanBank || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base font-bold text-red-900">{formData.loanBank || '無貸款'}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-red-800 mb-1">貸款金額 (Amount)</label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        name="loanAmount"
                                        value={formData.loanAmount || ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded"
                                    />
                                ) : (
                                    <p className="text-base font-bold text-red-900">{formData.loanAmount ? `$${Number(formData.loanAmount).toLocaleString()}` : '-'}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isTaxResident"
                                    checked={!!formData.isTaxResident}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-bold text-slate-800">是否為稅務居住者 (Tax Resident)</span>
                                    <p className="text-xs text-slate-500">
                                        Check if stay in Taiwan &gt; 183 days / year
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
                {/* Payroll Section */}
                <div className="mt-8 pt-8 border-t border-slate-200">
                    <PayrollList
                        workerId={worker.id}
                        employerId={worker.deployments?.[0]?.employerId || ''}
                    />
                </div>

                {/* Fee Schedule Section */}
                {worker.deployments && worker.deployments.length > 0 && (
                    <div className="mt-8 pt-0">
                        <FeeScheduleTable
                            schedules={worker.deployments[0].feeSchedules || []}
                            onRefresh={() => onUpdate(worker)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
