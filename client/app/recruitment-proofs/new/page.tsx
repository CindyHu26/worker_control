'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/PageContainer';
import EmployerSelector from '@/components/employers/EmployerSelector';
import { Button } from '@/components/ui/button';

interface FormData {
    employerId: string;
    registerDate: string;
    issueDate: string;
    jobCenter: string;
    receiptNumber: string;
    status: 'VALID' | 'EXPIRED' | 'USED';
}

export default function NewRecruitmentProofPage() {
    const router = useRouter();
    const { control, register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: {
            status: 'VALID',
            registerDate: format(new Date(), 'yyyy-MM-dd'),
            issueDate: format(new Date(), 'yyyy-MM-dd')
        }
    });

    const onSubmit = async (data: FormData) => {
        try {
            const res = await fetch('/api/recruitment-proofs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create');
            }

            toast.success('求才證明書已建立');
            router.push('/recruitment-proofs');
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    return (
        <PageContainer
            title="新增求才證明書"
            subtitle="登錄新的國內求才紀錄"
            actions={
                <Link href="/recruitment-proofs">
                    <Button variant="outline" className="gap-2">
                        <ArrowLeft size={16} />
                        返回列表
                    </Button>
                </Link>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 max-w-4xl space-y-6">
                <div className="bg-white p-6 rounded-lg border shadow-sm">
                    <h3 className="text-lg font-medium text-slate-800 mb-4 border-b pb-2">基本資訊</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Employer Selector */}
                        <div className="col-span-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">雇主 <span className="text-red-500">*</span></label>
                            <Controller
                                control={control}
                                name="employerId"
                                rules={{ required: '請選擇雇主' }}
                                render={({ field }) => (
                                    <EmployerSelector
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            {errors.employerId && <p className="text-red-500 text-xs mt-1">{errors.employerId.message}</p>}
                        </div>

                        {/* Receipt Number */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">證明書序號 <span className="text-red-500">*</span></label>
                            <input
                                {...register('receiptNumber', { required: '必填' })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="輸入序號"
                            />
                            {errors.receiptNumber && <p className="text-red-500 text-xs mt-1">{errors.receiptNumber.message}</p>}
                        </div>

                        {/* Job Center */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">受理機構</label>
                            <input
                                {...register('jobCenter')}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. 台北就業中心"
                            />
                        </div>

                        {/* Dates */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">求才登記日 <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                {...register('registerDate', { required: '必填' })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <p className="text-xs text-slate-400 mt-1">製造業需滿21天，照護需滿7天</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">證明書發文日 <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                {...register('issueDate', { required: '必填' })}
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        <Save size={16} />
                        儲存
                    </Button>
                </div>
            </form>
        </PageContainer>
    );
}
