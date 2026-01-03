'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import EmployerSelector from '@/components/employers/EmployerSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FormData {
    id?: string;
    employerId: string;
    receiptNumber: string;
    registerDate: string;
    issueDate: string;
    jobCenter: string;
    status: 'VALID' | 'EXPIRED' | 'USED';
    reviewFeeReceiptNo?: string;
    reviewFeePayDate?: string;
}

interface RecruitmentProofFormProps {
    initialData?: Partial<FormData>;
    isEdit?: boolean;
}

export default function RecruitmentProofForm({ initialData, isEdit = false }: RecruitmentProofFormProps) {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);

    const { control, register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
        defaultValues: {
            status: 'VALID',
            registerDate: format(new Date(), 'yyyy-MM-dd'),
            issueDate: format(new Date(), 'yyyy-MM-dd'),
            ...initialData
        }
    });

    // Reset form when initialData loads (for edit mode)
    useEffect(() => {
        if (initialData) {
            reset({
                ...initialData,
                registerDate: initialData.registerDate ? format(new Date(initialData.registerDate), 'yyyy-MM-dd') : '',
                issueDate: initialData.issueDate ? format(new Date(initialData.issueDate), 'yyyy-MM-dd') : '',
                reviewFeePayDate: initialData.reviewFeePayDate ? format(new Date(initialData.reviewFeePayDate), 'yyyy-MM-dd') : ''
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (data: FormData) => {
        setIsSaving(true);
        try {
            const url = isEdit && initialData?.id
                ? `/api/recruitment-proofs/${initialData.id}`
                : '/api/recruitment-proofs';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || '儲存失敗');
            }

            toast.success(isEdit ? '已更新求才證明書' : '已建立求才證明書');
            router.push('/recruitment-proofs');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <StandardPageLayout
            title={isEdit ? "編輯求才證明書" : "新增求才證明書"}
            subtitle="國內招募與求才登記 (Domestic Recruitment)"
            actions={
                <Link href="/recruitment-proofs">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft size={16} />
                        返回列表
                    </Button>
                </Link>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-5xl mx-auto space-y-6">
                <Card>
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-600 rounded-full inline-block"></span>
                            基本資訊
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Employer Selector - Full Row on Mobile, 2 Cols on Desktop */}
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    雇主 (Employer) <span className="text-red-500">*</span>
                                </label>
                                <Controller
                                    control={control}
                                    name="employerId"
                                    rules={{ required: '請選擇雇主' }}
                                    render={({ field }) => (
                                        <EmployerSelector
                                            value={field.value}
                                            onChange={field.onChange}
                                            disabled={isEdit} // Disable employer change on edit usually
                                        />
                                    )}
                                />
                                {errors.employerId && <p className="text-red-500 text-xs mt-1">{errors.employerId.message}</p>}
                            </div>

                            {/* Receipt Number */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    證明書序號 (Receipt No.) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('receiptNumber', { required: '必填' })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono text-sm"
                                    placeholder="例如: 112000123"
                                />
                                {errors.receiptNumber && <p className="text-red-500 text-xs mt-1">{errors.receiptNumber.message}</p>}
                            </div>

                            {/* Job Center */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    受理機構 (Job Center)
                                </label>
                                <input
                                    {...register('jobCenter')}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    placeholder="例如: 台北就業中心"
                                />
                            </div>

                            {/* Dates Section */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    求才登記日 (Register Date) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('registerDate', { required: '必填' })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">製造業需等待 21 天，看護需等待 7 天</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    證明書發文日 (Issue Date) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    {...register('issueDate', { required: '必填' })}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    狀態 (Status)
                                </label>
                                <select
                                    {...register('status')}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="VALID">有效 (VALID)</option>
                                    <option value="EXPIRED">過期 (EXPIRED)</option>
                                    <option value="USED">已使用 (USED)</option>
                                </select>
                            </div>

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="border-b bg-slate-50/50 pb-4">
                        <CardTitle className="text-lg font-medium text-slate-800 flex items-center gap-2">
                            <span className="w-1 h-6 bg-green-600 rounded-full inline-block"></span>
                            審查費資訊 (Review Fee)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Review Fee Receipt */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    審查費收據號碼
                                </label>
                                <input
                                    {...register('reviewFeeReceiptNo')}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    placeholder="輸入收據號碼"
                                />
                            </div>

                            {/* Review Fee Pay Date */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    繳費日期
                                </label>
                                <input
                                    type="date"
                                    {...register('reviewFeePayDate')}
                                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px] gap-2"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        {isEdit ? '儲存變更' : '建立證明書'}
                    </Button>
                </div>
            </form>
        </StandardPageLayout>
    );
}
