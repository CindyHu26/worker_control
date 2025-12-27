'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Employer {
    id: string;
    companyName: string;
    totalQuota: number;
}

interface QuotaInfo {
    hasQuota: boolean;
    totalQuota: number;
    usedQuota: number;
    remainingQuota: number;
    message: string;
}

interface JobOrderFormProps {
    initialData?: any;
    isEdit?: boolean;
}

const statusOptions = [
    { value: 'OPEN', label: '招募中' },
    { value: 'SOURCING', label: '選工中' },
    { value: 'PARTIAL', label: '部分錄取' },
    { value: 'FILLED', label: '額滿' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'CANCELLED', label: '已取消' },
];

const genderOptions = [
    { value: '', label: '不限' },
    { value: 'MALE', label: '男性' },
    { value: 'FEMALE', label: '女性' },
];

const nationalityOptions = [
    { value: '', label: '不限' },
    { value: 'VN', label: '越南' },
    { value: 'PH', label: '菲律賓' },
    { value: 'ID', label: '印尼' },
    { value: 'TH', label: '泰國' },
];

export default function JobOrderForm({ initialData, isEdit = false }: JobOrderFormProps) {
    const router = useRouter();
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(false);
    const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null);
    const [checkingQuota, setCheckingQuota] = useState(false);

    const [formData, setFormData] = useState({
        employerId: initialData?.employerId || '',
        title: initialData?.title || '',
        description: initialData?.description || '',
        requiredCount: initialData?.requiredCount || 1,
        skillRequirements: initialData?.skillRequirements || '',
        workLocation: initialData?.workLocation || '',
        jobType: initialData?.jobType || '',
        nationalityPreference: initialData?.nationalityPreference || '',
        genderPreference: initialData?.genderPreference || '',
        status: initialData?.status || 'OPEN',
        filledCount: initialData?.filledCount || 0,
    });

    useEffect(() => {
        fetchEmployers();
    }, []);

    useEffect(() => {
        if (formData.employerId) {
            checkQuota(formData.employerId);
        }
    }, [formData.employerId]);

    const fetchEmployers = async () => {
        try {
            const res = await fetch('/api/employers?limit=100');
            if (res.ok) {
                const data = await res.json();
                setEmployers(data.data || []);
            }
        } catch (e) {
            console.error('載入雇主失敗', e);
        }
    };

    const checkQuota = async (employerId: string) => {
        setCheckingQuota(true);
        try {
            const res = await fetch(`/api/job-orders/employer/${employerId}/quota`);
            if (res.ok) {
                const data = await res.json();
                setQuotaInfo(data);
            }
        } catch (e) {
            console.error('檢查名額失敗', e);
        } finally {
            setCheckingQuota(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEdit ? `/api/job-orders/${initialData.id}` : '/api/job-orders';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/job-orders/${data.id}`);
            } else {
                const error = await res.json();
                alert(error.error || '儲存失敗');
            }
        } catch (e) {
            console.error(e);
            alert('發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quota Alert */}
            {quotaInfo && (
                <div className={`p-4 rounded-lg border ${quotaInfo.hasQuota ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2">
                        {checkingQuota ? (
                            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                        ) : quotaInfo.hasQuota ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                        )}
                        <span className={quotaInfo.hasQuota ? 'text-green-800' : 'text-amber-800'}>
                            {quotaInfo.message}
                        </span>
                    </div>
                    {quotaInfo.totalQuota > 0 && (
                        <div className="mt-2 text-sm text-slate-600">
                            核准名額：{quotaInfo.totalQuota} 人 | 已使用：{quotaInfo.usedQuota} 人 | 剩餘：{quotaInfo.remainingQuota} 人
                        </div>
                    )}
                </div>
            )}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 雇主選擇 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        雇主 <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="employerId"
                        value={formData.employerId}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">請選擇雇主</option>
                        {employers.map(emp => (
                            <option key={emp.id} value={emp.id}>
                                {emp.companyName}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 狀態 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        狀態
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 職位名稱 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        職位名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="例：生產線作業員"
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 需求人數 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        需求人數 <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="requiredCount"
                        value={formData.requiredCount}
                        onChange={handleChange}
                        min={1}
                        required
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 國籍偏好 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        國籍偏好
                    </label>
                    <select
                        name="nationalityPreference"
                        value={formData.nationalityPreference}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {nationalityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 性別偏好 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        性別偏好
                    </label>
                    <select
                        name="genderPreference"
                        value={formData.genderPreference}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {genderOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 工種 */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        工種
                    </label>
                    <input
                        type="text"
                        name="jobType"
                        value={formData.jobType}
                        onChange={handleChange}
                        placeholder="例：製造業勞工"
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 工作地點 */}
                <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        工作地點
                    </label>
                    <input
                        type="text"
                        name="workLocation"
                        value={formData.workLocation}
                        onChange={handleChange}
                        placeholder="例：台中市大雅區"
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 技能要求 */}
                <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        技能要求
                    </label>
                    <textarea
                        name="skillRequirements"
                        value={formData.skillRequirements}
                        onChange={handleChange}
                        rows={2}
                        placeholder="描述所需技能或經驗..."
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* 職位說明 */}
                <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        職位說明
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="詳細說明工作內容..."
                        className="w-full px-3 py-2 border rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                >
                    取消
                </Button>
                <Button
                    type="submit"
                    disabled={loading || !formData.employerId || !formData.title}
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            儲存中...
                        </>
                    ) : (
                        isEdit ? '更新訂單' : '建立訂單'
                    )}
                </Button>
            </div>
        </form>
    );
}
