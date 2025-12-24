'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { apiPost, apiPut, apiGet } from '@/lib/api';

const formSchema = z.object({
    code: z.string().min(1, '代碼為必填').max(18),
    fullName: z.string().min(1, '中文姓名為必填').max(50),
    fullNameEn: z.string().max(100).optional(),
    gender: z.string().max(10).optional(),
    nationality: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
    idNumber: z.string().max(20).optional(),

    departmentCode: z.string().max(10).optional(),
    employeeNumber: z.string().max(10).optional(),
    jobTitle: z.string().max(50).optional(),
    domesticAgencyId: z.string().optional(),

    phone: z.string().max(30).optional(),
    mobilePhone: z.string().max(30).optional(),
    extension: z.string().max(12).optional(),
    email: z.string().email('請輸入有效的電子郵件').or(z.literal('')).optional(),
    receiveSms: z.boolean().default(false),

    contactPerson: z.string().max(50).optional(),
    contactPhone: z.string().max(30).optional(),

    mailingAddressZh: z.string().max(200).optional(),
    mailingAddressEn: z.string().max(200).optional(),
    residentialAddressZh: z.string().max(200).optional(),
    residentialAddressEn: z.string().max(200).optional(),

    emergencyContact: z.string().max(50).optional(),
    emergencyPhone: z.string().max(30).optional(),

    isSales: z.boolean().default(false),
    isAdmin: z.boolean().default(false),
    isCustomerService: z.boolean().default(false),
    isAccounting: z.boolean().default(false),
    isBilingual: z.boolean().default(false),

    employerAutoCode: z.string().max(10).optional(),
    contractCode: z.string().max(4).optional(),
    contractSeqUsed: z.number().int().optional(),
    salesGroupCode: z.string().max(10).optional(),
    expertise: z.string().max(200).optional(),

    postalAccountNo: z.string().max(12).optional(),
    postalAccountName: z.string().max(100).optional(),
    bankName: z.string().max(100).optional(),
    bankAccountName: z.string().max(100).optional(),
    bankAccountNo: z.string().max(20).optional(),

    hireDate: z.string().optional(),
    insuranceStartDate: z.string().optional(),
    resignationDate: z.string().optional(),
    insuranceEndDate: z.string().optional(),

    notes: z.string().optional(),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export function EmployeeForm({ initialData, isEdit = false }: EmployeeFormProps) {
    const router = useRouter();
    const [agencies, setAgencies] = useState<Array<{ id: string, agencyNameZh: string }>>([]);

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
            fullName: '',
            fullNameEn: '',
            gender: '',
            nationality: '',
            dateOfBirth: '',
            idNumber: '',
            departmentCode: '',
            employeeNumber: '',
            jobTitle: '',
            domesticAgencyId: '',
            phone: '',
            mobilePhone: '',
            extension: '',
            email: '',
            receiveSms: false,
            contactPerson: '',
            contactPhone: '',
            mailingAddressZh: '',
            mailingAddressEn: '',
            residentialAddressZh: '',
            residentialAddressEn: '',
            emergencyContact: '',
            emergencyPhone: '',
            isSales: false,
            isAdmin: false,
            isCustomerService: false,
            isAccounting: false,
            isBilingual: false,
            employerAutoCode: '',
            contractCode: '',
            contractSeqUsed: 0,
            salesGroupCode: '',
            expertise: '',
            postalAccountNo: '',
            postalAccountName: '',
            bankName: '',
            bankAccountName: '',
            bankAccountNo: '',
            hireDate: '',
            insuranceStartDate: '',
            resignationDate: '',
            insuranceEndDate: '',
            notes: '',
            isActive: true,
            ...initialData,
        },
    });

    useEffect(() => {
        // Fetch agencies for dropdown
        const fetchAgencies = async () => {
            try {
                const data = await apiGet('http://localhost:3001/api/domestic-agencies');
                setAgencies(data.data || []);
            } catch (error) {
                console.error('Failed to fetch agencies:', error);
            }
        };
        fetchAgencies();

        if (initialData) {
            const formData: any = { ...initialData };
            // Convert dates
            if (initialData.dateOfBirth) formData.dateOfBirth = new Date(initialData.dateOfBirth).toISOString().split('T')[0];
            if (initialData.hireDate) formData.hireDate = new Date(initialData.hireDate).toISOString().split('T')[0];
            if (initialData.insuranceStartDate) formData.insuranceStartDate = new Date(initialData.insuranceStartDate).toISOString().split('T')[0];
            if (initialData.resignationDate) formData.resignationDate = new Date(initialData.resignationDate).toISOString().split('T')[0];
            if (initialData.insuranceEndDate) formData.insuranceEndDate = new Date(initialData.insuranceEndDate).toISOString().split('T')[0];
            if (initialData.domesticAgency) formData.domesticAgencyId = initialData.domesticAgency.id;
            reset(formData);
        }
    }, [initialData, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `http://localhost:3001/api/employees/${initialData.id}`
                : 'http://localhost:3001/api/employees';

            if (isEdit) {
                await apiPut(url, values);
                toast.success('員工資料更新成功');
            } else {
                await apiPost(url, values);
                toast.success('員工資料建立成功');
            }

            router.push('/employees');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card className="w-full max-w-7xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle>{isEdit ? '編輯員工資料' : '新增員工資料'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* 基本資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">基本資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="code">代碼 <span className="text-red-500">*</span></Label>
                                <Input id="code" placeholder="員工代碼" {...register('code')} className="bg-white" />
                                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">中文姓名 <span className="text-red-500">*</span></Label>
                                <Input id="fullName" placeholder="例如：王小明" {...register('fullName')} className="bg-white" />
                                {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullNameEn">英文姓名</Label>
                                <Input id="fullNameEn" placeholder="例如：Wang Xiao Ming" {...register('fullNameEn')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">性別</Label>
                                <select id="gender" {...register('gender')} className="w-full px-3 py-2 border rounded-md bg-white">
                                    <option value="">請選擇</option>
                                    <option value="男">男</option>
                                    <option value="女">女</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nationality">國籍</Label>
                                <Input id="nationality" placeholder="例如：台灣" {...register('nationality')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">生日</Label>
                                <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idNumber">身份證字號</Label>
                                <Input id="idNumber" placeholder="身份證字號" {...register('idNumber')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 職務資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">職務資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="employeeNumber">員工編號</Label>
                                <Input id="employeeNumber" placeholder="員工編號" {...register('employeeNumber')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="departmentCode">部門代碼</Label>
                                <Input id="departmentCode" placeholder="部門代碼" {...register('departmentCode')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jobTitle">職務名稱</Label>
                                <Input id="jobTitle" placeholder="例如：業務專員" {...register('jobTitle')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="domesticAgencyId">所屬國內仲介</Label>
                                <select id="domesticAgencyId" {...register('domesticAgencyId')} className="w-full px-3 py-2 border rounded-md bg-white">
                                    <option value="">請選擇</option>
                                    {agencies.map(agency => (
                                        <option key={agency.id} value={agency.id}>{agency.agencyNameZh}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 聯絡資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">聯絡資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="phone">電話</Label>
                                <Input id="phone" placeholder="例如：02-12345678" {...register('phone')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobilePhone">手機</Label>
                                <Input id="mobilePhone" placeholder="例如：0912-345678" {...register('mobilePhone')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extension">分機</Label>
                                <Input id="extension" placeholder="分機號碼" {...register('extension')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">電子郵件</Label>
                                <Input id="email" type="email" placeholder="例如：employee@company.com" {...register('email')} className="bg-white" />
                                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPerson">聯絡人</Label>
                                <Input id="contactPerson" placeholder="聯絡人姓名" {...register('contactPerson')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactPhone">聯絡電話</Label>
                                <Input id="contactPhone" placeholder="聯絡人電話" {...register('contactPhone')} className="bg-white" />
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="receiveSms" onCheckedChange={(checked) => setValue('receiveSms', checked as boolean)} defaultChecked={initialData?.receiveSms ?? false} />
                                    <Label htmlFor="receiveSms" className="font-normal cursor-pointer">接收簡訊</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 地址資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">地址資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="mailingAddressZh">通訊住址（中文）</Label>
                                <Input id="mailingAddressZh" placeholder="通訊住址" {...register('mailingAddressZh')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mailingAddressEn">通訊住址（英文）</Label>
                                <Input id="mailingAddressEn" placeholder="Mailing Address" {...register('mailingAddressEn')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="residentialAddressZh">戶籍住址（中文）</Label>
                                <Input id="residentialAddressZh" placeholder="戶籍住址" {...register('residentialAddressZh')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="residentialAddressEn">戶籍住址（英文）</Label>
                                <Input id="residentialAddressEn" placeholder="Residential Address" {...register('residentialAddressEn')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 緊急聯絡人 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">緊急聯絡人</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="emergencyContact">緊急聯絡人</Label>
                                <Input id="emergencyContact" placeholder="緊急聯絡人姓名" {...register('emergencyContact')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergencyPhone">緊急聯絡電話</Label>
                                <Input id="emergencyPhone" placeholder="緊急聯絡電話" {...register('emergencyPhone')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 職務角色 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">職務角色</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="isSales" onCheckedChange={(checked) => setValue('isSales', checked as boolean)} defaultChecked={initialData?.isSales ?? false} />
                                <Label htmlFor="isSales" className="font-normal cursor-pointer">業務</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="isAdmin" onCheckedChange={(checked) => setValue('isAdmin', checked as boolean)} defaultChecked={initialData?.isAdmin ?? false} />
                                <Label htmlFor="isAdmin" className="font-normal cursor-pointer">行政</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="isCustomerService" onCheckedChange={(checked) => setValue('isCustomerService', checked as boolean)} defaultChecked={initialData?.isCustomerService ?? false} />
                                <Label htmlFor="isCustomerService" className="font-normal cursor-pointer">客服</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="isAccounting" onCheckedChange={(checked) => setValue('isAccounting', checked as boolean)} defaultChecked={initialData?.isAccounting ?? false} />
                                <Label htmlFor="isAccounting" className="font-normal cursor-pointer">會計</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="isBilingual" onCheckedChange={(checked) => setValue('isBilingual', checked as boolean)} defaultChecked={initialData?.isBilingual ?? false} />
                                <Label htmlFor="isBilingual" className="font-normal cursor-pointer">雙語</Label>
                            </div>
                        </div>
                    </div>

                    {/* 業務相關 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">業務相關</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="employerAutoCode">雇主自動編號代碼</Label>
                                <Input id="employerAutoCode" placeholder="代碼" {...register('employerAutoCode')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contractCode">業務合約代碼</Label>
                                <Input id="contractCode" placeholder="合約代碼" {...register('contractCode')} className="bg-white" maxLength={4} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contractSeqUsed">合約已用序號</Label>
                                <Input id="contractSeqUsed" type="number" {...register('contractSeqUsed', { valueAsNumber: true })} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="salesGroupCode">業務分群代碼</Label>
                                <Input id="salesGroupCode" placeholder="分群代碼" {...register('salesGroupCode')} className="bg-white" />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="expertise">專長</Label>
                                <Input id="expertise" placeholder="專長描述" {...register('expertise')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 銀行帳戶 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">銀行帳戶資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="postalAccountNo">郵政劃撥帳號</Label>
                                <Input id="postalAccountNo" placeholder="劃撥帳號" {...register('postalAccountNo')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postalAccountName">郵政劃撥戶名</Label>
                                <Input id="postalAccountName" placeholder="劃撥戶名" {...register('postalAccountName')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankName">匯款銀行名稱</Label>
                                <Input id="bankName" placeholder="銀行名稱" {...register('bankName')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankAccountName">銀行帳戶名稱</Label>
                                <Input id="bankAccountName" placeholder="帳戶名稱" {...register('bankAccountName')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankAccountNo">銀行帳號</Label>
                                <Input id="bankAccountNo" placeholder="銀行帳號" {...register('bankAccountNo')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 到離職資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">到離職資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="hireDate">到職日</Label>
                                <Input id="hireDate" type="date" {...register('hireDate')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="insuranceStartDate">加保日</Label>
                                <Input id="insuranceStartDate" type="date" {...register('insuranceStartDate')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="resignationDate">離職日</Label>
                                <Input id="resignationDate" type="date" {...register('resignationDate')} className="bg-white" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="insuranceEndDate">退保日</Label>
                                <Input id="insuranceEndDate" type="date" {...register('insuranceEndDate')} className="bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* 備註與狀態 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">備註與狀態</h3>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="notes">備註</Label>
                                <Textarea id="notes" placeholder="備註說明" {...register('notes')} className="bg-white" rows={4} />
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox id="isActive" onCheckedChange={(checked) => setValue('isActive', checked as boolean)} defaultChecked={initialData?.isActive ?? true} />
                                <Label htmlFor="isActive" className="font-normal cursor-pointer">在職狀態</Label>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
                        <Button type="submit" disabled={isSubmitting}>{isEdit ? '更新員工資料' : '建立員工資料'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
