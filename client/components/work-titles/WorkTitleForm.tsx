'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { apiPost, apiPut, apiGet } from '@/lib/api';

const formSchema = z.object({
    categoryId: z.string().uuid().optional().nullable(),
    code: z.string().min(1, '代碼為必填').max(20),
    titleZh: z.string().min(1, '中文工種名稱為必填').max(100),
    titleEn: z.string().max(100).default(''),
    titleTh: z.string().max(100).optional(),
    titleId: z.string().max(100).optional(),
    titleVn: z.string().max(100).optional(),
    isIntermediate: z.boolean().default(false),
    isDefault: z.boolean().default(false),
    employmentSecurityFee: z.number().int().default(2000),
    reentrySecurityFee: z.number().int().default(2000),
    agencyAccidentInsurance: z.boolean().default(false),
    agencyAccidentInsuranceAmt: z.number().int().default(0),
    agencyLaborHealthInsurance: z.boolean().default(false),
    collectBankLoan: z.boolean().default(false),
    payDay: z.number().int().min(1).max(31).optional().nullable(),
    requiresMedicalCheckup: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface ApplicationCategory {
    id: string;
    code: string;
    nameZh: string;
}

interface WorkTitleFormProps {
    initialData?: FormValues & { id: string; category?: ApplicationCategory };
    isEdit?: boolean;
}

export function WorkTitleForm({ initialData, isEdit = false }: WorkTitleFormProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<ApplicationCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            categoryId: null,
            code: '',
            titleZh: '',
            titleEn: '',
            titleTh: '',
            titleId: '',
            titleVn: '',
            isIntermediate: false,
            isDefault: false,
            employmentSecurityFee: 2000,
            reentrySecurityFee: 2000,
            agencyAccidentInsurance: false,
            agencyAccidentInsuranceAmt: 0,
            agencyLaborHealthInsurance: false,
            collectBankLoan: false,
            payDay: null,
            requiresMedicalCheckup: false,
            sortOrder: 0,
            isActive: true,
            ...initialData,
        },
    });

    const agencyAccidentInsurance = watch('agencyAccidentInsurance');
    const isIntermediate = watch('isIntermediate');

    // Fetch application categories for dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const result = await apiGet('http://localhost:3001/api/application-categories');
                setCategories(result.data || []);
            } catch (error) {
                console.error('Failed to fetch application categories:', error);
                toast.error('無法載入申請項目');
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `http://localhost:3001/api/work-titles/${initialData.id}`
                : 'http://localhost:3001/api/work-titles';

            // Prepare payload
            const payload = {
                ...values,
                categoryId: values.categoryId || null,
            };

            if (isEdit) {
                await apiPut(url, payload);
                toast.success('工種更新成功');
            } else {
                await apiPost(url, payload);
                toast.success('工種建立成功');
            }

            router.push('/work-titles');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card className="w-full max-w-6xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle>{isEdit ? '編輯工種' : '新增工種'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* 歸屬分類 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">歸屬分類</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="categoryId">所屬申請項目</Label>
                                <select
                                    id="categoryId"
                                    {...register('categoryId')}
                                    className="w-full h-10 px-3 border rounded-md bg-white"
                                    disabled={loadingCategories}
                                >
                                    <option value="">-- 無 (通用工種) --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nameZh} ({cat.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500">
                                    選擇此工種所屬的申請項目，用於自動帶入預設值
                                </p>
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isIntermediate"
                                        onCheckedChange={(checked) => setValue('isIntermediate', checked as boolean)}
                                        defaultChecked={initialData?.isIntermediate ?? false}
                                    />
                                    <Label htmlFor="isIntermediate" className="font-normal cursor-pointer">
                                        中階技術人力
                                    </Label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    勾選後，此工種將標記為中階技術人力專用
                                </p>
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isDefault"
                                        onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
                                        defaultChecked={initialData?.isDefault ?? false}
                                    />
                                    <Label htmlFor="isDefault" className="font-normal cursor-pointer">
                                        預設工種
                                    </Label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    勾選後，此工種將作為該申請項目的預設值
                                </p>
                            </div>

                        </div>
                    </div>

                    {isIntermediate && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                            <p className="text-amber-800 text-sm">
                                ⚠️ 此工種標記為「中階技術人力」，使用時需符合勞動部留才久用相關規定。
                            </p>
                        </div>
                    )}

                    {/* 基本資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">基本資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="code">代碼 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="例如：01"
                                    {...register('code')}
                                    className="bg-white"
                                />
                                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="titleZh">中文工種名稱 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="titleZh"
                                    placeholder="例如：機械操作工"
                                    {...register('titleZh')}
                                    className="bg-white"
                                />
                                {errors.titleZh && <p className="text-sm text-red-500">{errors.titleZh.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="titleEn">英文工種名稱</Label>
                                <Input
                                    id="titleEn"
                                    placeholder="例如：Machine Operator"
                                    {...register('titleEn')}
                                    className="bg-white"
                                />
                                {errors.titleEn && <p className="text-sm text-red-500">{errors.titleEn.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="titleTh">泰文工種名稱</Label>
                                <Input
                                    id="titleTh"
                                    placeholder="泰文名稱（選填）"
                                    {...register('titleTh')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="titleId">印尼文工種名稱</Label>
                                <Input
                                    id="titleId"
                                    placeholder="印尼文名稱（選填）"
                                    {...register('titleId')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="titleVn">越南文工種名稱</Label>
                                <Input
                                    id="titleVn"
                                    placeholder="越南文名稱（選填）"
                                    {...register('titleVn')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 費用設定 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">費用設定</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="employmentSecurityFee">一般就安費 (元)</Label>
                                <Input
                                    type="number"
                                    id="employmentSecurityFee"
                                    {...register('employmentSecurityFee', { valueAsNumber: true })}
                                    className="bg-white"
                                />
                                {errors.employmentSecurityFee && <p className="text-sm text-red-500">{errors.employmentSecurityFee.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reentrySecurityFee">重投就安費 (元)</Label>
                                <Input
                                    type="number"
                                    id="reentrySecurityFee"
                                    {...register('reentrySecurityFee', { valueAsNumber: true })}
                                    className="bg-white"
                                />
                                {errors.reentrySecurityFee && <p className="text-sm text-red-500">{errors.reentrySecurityFee.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agencyAccidentInsuranceAmt">代辦意外險保額 (元)</Label>
                                <Input
                                    type="number"
                                    id="agencyAccidentInsuranceAmt"
                                    {...register('agencyAccidentInsuranceAmt', { valueAsNumber: true })}
                                    className="bg-white"
                                    disabled={!agencyAccidentInsurance}
                                />
                            </div>

                        </div>
                    </div>

                    {/* 服務與合規 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">服務與合規設定</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="agencyAccidentInsurance"
                                        onCheckedChange={(checked) => setValue('agencyAccidentInsurance', checked as boolean)}
                                        defaultChecked={initialData?.agencyAccidentInsurance ?? false}
                                    />
                                    <Label htmlFor="agencyAccidentInsurance" className="font-normal cursor-pointer">
                                        代辦意外險加保
                                    </Label>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="agencyLaborHealthInsurance"
                                        onCheckedChange={(checked) => setValue('agencyLaborHealthInsurance', checked as boolean)}
                                        defaultChecked={initialData?.agencyLaborHealthInsurance ?? false}
                                    />
                                    <Label htmlFor="agencyLaborHealthInsurance" className="font-normal cursor-pointer">
                                        代辦勞健保加保
                                    </Label>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="collectBankLoan"
                                        onCheckedChange={(checked) => setValue('collectBankLoan', checked as boolean)}
                                        defaultChecked={initialData?.collectBankLoan ?? false}
                                    />
                                    <Label htmlFor="collectBankLoan" className="font-normal cursor-pointer">
                                        代收銀行貸款
                                    </Label>
                                </div>
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="requiresMedicalCheckup"
                                        onCheckedChange={(checked) => setValue('requiresMedicalCheckup', checked as boolean)}
                                        defaultChecked={initialData?.requiresMedicalCheckup ?? false}
                                    />
                                    <Label htmlFor="requiresMedicalCheckup" className="font-normal cursor-pointer">
                                        每半年體檢
                                    </Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payDay">發薪日 (1-31)</Label>
                                <Input
                                    type="number"
                                    id="payDay"
                                    min="1"
                                    max="31"
                                    {...register('payDay', {
                                        setValueAs: v => v === '' ? null : parseInt(v)
                                    })}
                                    className="bg-white"
                                />
                                {errors.payDay && <p className="text-sm text-red-500">{errors.payDay.message}</p>}
                            </div>

                        </div>
                    </div>

                    {/* 系統設定 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">系統設定</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">排序</Label>
                                <Input
                                    type="number"
                                    id="sortOrder"
                                    {...register('sortOrder', { valueAsNumber: true })}
                                    className="bg-white"
                                />
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isActive"
                                        onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
                                        defaultChecked={initialData?.isActive ?? true}
                                    />
                                    <Label htmlFor="isActive" className="font-normal cursor-pointer">
                                        啟用狀態
                                    </Label>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isEdit ? '更新工種' : '建立工種'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
