import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PayrollList({ workerId, employerId }: { workerId: string, employerId: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/tax/worker/${workerId}/records`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, [workerId]);

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">薪資冊登錄 (Payroll Entry)</h3>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm"
                >
                    <Plus size={16} /> 新增薪資
                </button>
            </div>

            {loading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
            ) : records.length === 0 ? (
                <div className="text-gray-500 text-sm border p-8 text-center rounded bg-gray-50">
                    尚無薪資資料 (No payroll records found)
                </div>
            ) : (
                <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                            <tr>
                                <th className="px-4 py-3">給薪日 (Pay Date)</th>
                                <th className="px-4 py-3">工作期間 (Period)</th>
                                <th className="px-4 py-3 text-right">實付薪資 (Salary)</th>
                                <th className="px-4 py-3 text-right">獎金 (Bonus)</th>
                                <th className="px-4 py-3 text-right">扣繳稅額 (Tax)</th>
                                <th className="px-4 py-3 text-right">稅率 (Ref Rate)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">{format(new Date(record.payDate), 'yyyy-MM-dd')}</td>
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(new Date(record.workPeriodStart), 'MM/dd')} - {format(new Date(record.workPeriodEnd), 'MM/dd')}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{Number(record.salaryAmount).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">{Number(record.bonusAmount) > 0 ? Number(record.bonusAmount).toLocaleString() : '-'}</td>
                                    <td className="px-4 py-3 text-right text-red-600">
                                        {Number(record.taxWithheld) > 0 ? Number(record.taxWithheld).toLocaleString() : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-500">
                                        {(Number(record.taxRateUsed) * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <PayrollEntryModal
                    workerId={workerId}
                    employerId={employerId}
                    onClose={() => setShowModal(false)}
                    onSuccess={() => {
                        setShowModal(false);
                        fetchRecords();
                    }}
                />
            )}
        </div>
    );
}

function PayrollEntryModal({ workerId, employerId, onClose, onSuccess }: any) {
    const [form, setForm] = useState({
        payDate: new Date().toISOString().split('T')[0],
        salaryAmount: '',
        bonusAmount: '',
        taxWithheld: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // Auto-calculate tax (simple helper, user can override)
    // Assuming 6% for non-resident low income logic just as a helper
    useEffect(() => {
        const salary = Number(form.salaryAmount) || 0;
        const bonus = Number(form.bonusAmount) || 0;
        const total = salary + bonus;
        // Simple suggestion: if total > minWage * 1.5, maybe 6%? 
        // Just leaving it blank or simple default is better.
        // Let's not auto-fill to avoid confusion unless requested.
    }, [form.salaryAmount, form.bonusAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('http://localhost:3001/api/tax/payroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerId,
                    employerId,
                    payDate: form.payDate,
                    salaryAmount: form.salaryAmount,
                    bonusAmount: form.bonusAmount,
                    taxWithheld: form.taxWithheld
                })
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert('Failed to save record');
            }
        } catch (err) {
            console.error(err);
            alert('Error saving record');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                <h3 className="font-bold text-lg mb-4">新增薪資紀錄 (Add Payroll)</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">給薪日期 (Pay Date)</label>
                        <input
                            type="date"
                            required
                            className="w-full border p-2 rounded"
                            value={form.payDate}
                            onChange={e => setForm({ ...form, payDate: e.target.value })}
                        />
                        <p className="text-xs text-gray-500 mt-1">工作期間將自動推算為上個月</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">實付薪資 (Salary Amount)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            className="w-full border p-2 rounded"
                            value={form.salaryAmount}
                            onChange={e => setForm({ ...form, salaryAmount: e.target.value })}
                            placeholder="e.g. 27470"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">獎金/加班費 (Bonus)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full border p-2 rounded"
                            value={form.bonusAmount}
                            onChange={e => setForm({ ...form, bonusAmount: e.target.value })}
                            placeholder="Optional"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">扣繳稅額 (Tax Withheld)</label>
                        <input
                            type="number"
                            min="0"
                            className="w-full border p-2 rounded"
                            value={form.taxWithheld}
                            onChange={e => setForm({ ...form, taxWithheld: e.target.value })}
                            placeholder="e.g. 1648"
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting ? '儲存中...' : '確認新增'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
