'use client';

import React, { useEffect } from 'react';
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
import { apiPost, apiPut } from '@/lib/api';

const formSchema = z.object({
    code: z.string().min(1, '代號為必填').max(10),
    agencyNameZh: z.string().min(1, '公司名稱（中文）為必填').max(100),
    agencyNameEn: z.string().max(100).optional(),
    agencyNameShort: z.string().max(50).optional(),

    phone: z.string().max(20).optional(),
    fax: z.string().max(20).optional(),
    email: z.string().email('請輸入有效的電子郵件').or(z.literal('')).optional(),
    emergencyEmail: z.string().max(255).optional(),
    website: z.string().max(100).optional(),
    customerServicePhone: z.string().max(20).optional(),
    emergencyPhone: z.string().max(20).optional(),

    zipCode: z.string().max(5).optional(),
    cityCode: z.string().max(3).optional(),
    addressZh: z.string().max(200).optional(),
    addressEn: z.string().max(200).optional(),

    representativeName: z.string().max(50).optional(),
    representativeNameEn: z.string().max(100).optional(),
    representativeIdNo: z.string().max(20).optional(),
    representativePassport: z.string().max(20).optional(),
    checkPayableTo: z.string().max(50).optional(),

    taxId: z.string().max(10).optional(),
    taxRegistrationNo: z.string().max(20).optional(),
    permitNumber: z.string().max(20).optional(),
    permitValidFrom: z.string().optional(),
    permitValidTo: z.string().optional(),
    businessRegistrationNo: z.string().max(50).optional(),

    postalAccountNo: z.string().max(20).optional(),
    postalAccountName: z.string().max(100).optional(),
    bankName: z.string().max(100).optional(),
    bankCode: z.string().max(3).optional(),
    bankBranchCode: z.string().max(4).optional(),
    bankAccountNo: z.string().max(20).optional(),
    bankAccountName: z.string().max(100).optional(),

    accountant: z.string().max(50).optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DomesticAgencyFormProps {
    initialData?: FormValues & { id: string };
    isEdit?: boolean;
}

export function DomesticAgencyForm({ initialData, isEdit = false }: DomesticAgencyFormProps) {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: '',
            agencyNameZh: '',
            agencyNameEn: '',
            agencyNameShort: '',
            phone: '',
            fax: '',
            email: '',
            emergencyEmail: '',
            website: '',
            customerServicePhone: '',
            emergencyPhone: '',
            zipCode: '',
            cityCode: '',
            addressZh: '',
            addressEn: '',
            representativeName: '',
            representativeNameEn: '',
            representativeIdNo: '',
            representativePassport: '',
            checkPayableTo: '',
            taxId: '',
            taxRegistrationNo: '',
            permitNumber: '',
            permitValidFrom: '',
            permitValidTo: '',
            businessRegistrationNo: '',
            postalAccountNo: '',
            postalAccountName: '',
            bankName: '',
            bankCode: '',
            bankBranchCode: '',
            bankAccountNo: '',
            bankAccountName: '',
            accountant: '',
            sortOrder: 0,
            isActive: true,
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            // Convert dates for form
            const formData: any = { ...initialData };
            if (initialData.permitValidFrom) {
                formData.permitValidFrom = new Date(initialData.permitValidFrom).toISOString().split('T')[0];
            }
            if (initialData.permitValidTo) {
                formData.permitValidTo = new Date(initialData.permitValidTo).toISOString().split('T')[0];
            }
            reset(formData);
        }
    }, [initialData, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `http://localhost:3001/api/domestic-agencies/${initialData.id}`
                : 'http://localhost:3001/api/domestic-agencies';

            if (isEdit) {
                await apiPut(url, values);
                toast.success('國內仲介公司更新成功');
            } else {
                await apiPost(url, values);
                toast.success('國內仲介公司建立成功');
            }

            router.push('/domestic-agencies');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card className="w-full max-w-7xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle>{isEdit ? '編輯國內仲介公司' : '新增國內仲介公司'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* 基本資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">基本資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="code">代號 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="例如：A001"
                                    {...register('code')}
                                    className="bg-white"
                                />
                                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agencyNameZh">公司名稱（中文） <span className="text-red-500">*</span></Label>
                                <Input
                                    id="agencyNameZh"
                                    placeholder="例如：XX人力仲介股份有限公司"
                                    {...register('agencyNameZh')}
                                    className="bg-white"
                                />
                                {errors.agencyNameZh && <p className="text-sm text-red-500">{errors.agencyNameZh.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agencyNameEn">公司名稱（英文）</Label>
                                <Input
                                    id="agencyNameEn"
                                    placeholder="例如：XX Manpower Agency Co., Ltd."
                                    {...register('agencyNameEn')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agencyNameShort">公司簡稱</Label>
                                <Input
                                    id="agencyNameShort"
                                    placeholder="簡稱"
                                    {...register('agencyNameShort')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="taxId">統一編號</Label>
                                <Input
                                    id="taxId"
                                    placeholder="8位數字"
                                    {...register('taxId')}
                                    className="bg-white"
                                    maxLength={10}
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

                    {/* 聯絡資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">聯絡資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="phone">電話</Label>
                                <Input
                                    id="phone"
                                    placeholder="例如：02-12345678"
                                    {...register('phone')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fax">傳真</Label>
                                <Input
                                    id="fax"
                                    placeholder="例如：02-12345679"
                                    {...register('fax')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">電子郵件</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="例如：info@company.com"
                                    {...register('email')}
                                    className="bg-white"
                                />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergencyEmail">緊急待辦收件者信箱</Label>
                                <Input
                                    id="emergencyEmail"
                                    placeholder="緊急聯絡信箱"
                                    {...register('emergencyEmail')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">網址</Label>
                                <Input
                                    id="website"
                                    placeholder="例如：https://www.company.com"
                                    {...register('website')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="customerServicePhone">客戶申訴專線</Label>
                                <Input
                                    id="customerServicePhone"
                                    placeholder="客服專線"
                                    {...register('customerServicePhone')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergencyPhone">緊急連絡電話</Label>
                                <Input
                                    id="emergencyPhone"
                                    placeholder="緊急聯絡電話"
                                    {...register('emergencyPhone')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 地址資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">地址資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="zipCode">郵遞區號</Label>
                                <Input
                                    id="zipCode"
                                    placeholder="5位數字"
                                    {...register('zipCode')}
                                    className="bg-white"
                                    maxLength={5}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cityCode">縣市別代碼</Label>
                                <Input
                                    id="cityCode"
                                    placeholder="縣市代碼"
                                    {...register('cityCode')}
                                    className="bg-white"
                                    maxLength={3}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <Label htmlFor="addressZh">公司地址（中文）</Label>
                                <Input
                                    id="addressZh"
                                    placeholder="完整地址"
                                    {...register('addressZh')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2 lg:col-span-3">
                                <Label htmlFor="addressEn">公司地址（英文）</Label>
                                <Input
                                    id="addressEn"
                                    placeholder="English Address"
                                    {...register('addressEn')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 負責人資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">負責人資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="representativeName">負責人姓名</Label>
                                <Input
                                    id="representativeName"
                                    placeholder="負責人姓名"
                                    {...register('representativeName')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="representativeNameEn">負責人姓名（英文）</Label>
                                <Input
                                    id="representativeNameEn"
                                    placeholder="Representative Name"
                                    {...register('representativeNameEn')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="representativeIdNo">負責人身份證號</Label>
                                <Input
                                    id="representativeIdNo"
                                    placeholder="身份證號"
                                    {...register('representativeIdNo')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="representativePassport">負責人護照號碼</Label>
                                <Input
                                    id="representativePassport"
                                    placeholder="護照號碼"
                                    {...register('representativePassport')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="checkPayableTo">請款開立支票抬頭</Label>
                                <Input
                                    id="checkPayableTo"
                                    placeholder="支票抬頭"
                                    {...register('checkPayableTo')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 公司證照資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">公司證照資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="taxRegistrationNo">稅籍編號</Label>
                                <Input
                                    id="taxRegistrationNo"
                                    placeholder="稅籍編號"
                                    {...register('taxRegistrationNo')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="permitNumber">公司許可證字號</Label>
                                <Input
                                    id="permitNumber"
                                    placeholder="許可證字號"
                                    {...register('permitNumber')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="businessRegistrationNo">營利事業登記證號</Label>
                                <Input
                                    id="businessRegistrationNo"
                                    placeholder="營利事業登記證號"
                                    {...register('businessRegistrationNo')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="permitValidFrom">許可證效期（起）</Label>
                                <Input
                                    id="permitValidFrom"
                                    type="date"
                                    {...register('permitValidFrom')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="permitValidTo">許可證效期（訖）</Label>
                                <Input
                                    id="permitValidTo"
                                    type="date"
                                    {...register('permitValidTo')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 銀行帳戶資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">銀行帳戶資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="postalAccountNo">郵政劃撥帳號</Label>
                                <Input
                                    id="postalAccountNo"
                                    placeholder="劃撥帳號"
                                    {...register('postalAccountNo')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postalAccountName">郵政劃撥戶名</Label>
                                <Input
                                    id="postalAccountName"
                                    placeholder="劃撥戶名"
                                    {...register('postalAccountName')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankName">匯款銀行名稱</Label>
                                <Input
                                    id="bankName"
                                    placeholder="銀行名稱"
                                    {...register('bankName')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankCode">銀行總行代號</Label>
                                <Input
                                    id="bankCode"
                                    placeholder="3位數字"
                                    {...register('bankCode')}
                                    className="bg-white"
                                    maxLength={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankBranchCode">銀行分支單位代號</Label>
                                <Input
                                    id="bankBranchCode"
                                    placeholder="4位數字"
                                    {...register('bankBranchCode')}
                                    className="bg-white"
                                    maxLength={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankAccountNo">銀行帳號</Label>
                                <Input
                                    id="bankAccountNo"
                                    placeholder="銀行帳號"
                                    {...register('bankAccountNo')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankAccountName">銀行帳戶名稱</Label>
                                <Input
                                    id="bankAccountName"
                                    placeholder="帳戶名稱"
                                    {...register('bankAccountName')}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    {/* 內部管理 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">內部管理</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="accountant">帳務會計</Label>
                                <Input
                                    id="accountant"
                                    placeholder="負責會計人員"
                                    {...register('accountant')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sortOrder">排序</Label>
                                <Input
                                    type="number"
                                    id="sortOrder"
                                    {...register('sortOrder', { valueAsNumber: true })}
                                    className="bg-white"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isEdit ? '更新公司資料' : '建立公司資料'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
