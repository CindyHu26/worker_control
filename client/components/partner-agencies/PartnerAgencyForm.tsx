'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiPost, apiPatch } from '@/lib/api';

// Schema Definition (Must match Backend partially but strictly strict for UI)
const formSchema = z.object({
    code: z.string().min(1, '代號為必填'),
    agencyNameZh: z.string().min(1, '公司名稱(中)為必填'),
    agencyNameZhShort: z.string().optional(),
    agencyNameEn: z.string().optional(),
    agencyNameEnShort: z.string().optional(),

    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email('Email 格式不正確').optional().or(z.literal('')),

    country: z.string().length(2, '國別代碼必須為 2 碼').optional().or(z.literal('')),
    countryNameZh: z.string().optional(),

    addressZh: z.string().optional(),
    addressEn: z.string().optional(),
    addressShort: z.string().optional(),

    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    mailingAddressZh: z.string().optional(),
    mailingAddressEn: z.string().optional(),

    representativeName: z.string().optional(),
    representativeNameEn: z.string().optional(),
    representativeIdNo: z.string().optional(),
    representativePassport: z.string().optional(),

    taxId: z.string().optional(),
    businessRegistrationNo: z.string().optional(),
    permitNumber: z.string().optional(),
    foreignLicenseNo: z.string().optional(),
    foreignLicenseExpiry: z.string().optional(), // Date string YYYY-MM-DD

    molPermitNo: z.string().optional(),
    molValidFrom: z.string().optional(),
    molValidTo: z.string().optional(),

    payeeName: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNo: z.string().optional(),
    bankAddress: z.string().optional(),
    loanBankCode: z.string().optional(),

    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PartnerAgencyFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function PartnerAgencyForm({ initialData, isEdit = false }: PartnerAgencyFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Initial Values Transformation
    const defaultValues: Partial<FormValues> = React.useMemo(() => {
        if (!initialData) return {
            code: '',
            agencyNameZh: '',
            country: 'VN', // Default
        };

        // Date formatting helpers
        const formatDate = (date: string | null) => date ? new Date(date).toISOString().split('T')[0] : '';

        return {
            ...initialData,
            foreignLicenseExpiry: formatDate(initialData.foreignLicenseExpiry),
            molValidFrom: formatDate(initialData.molValidFrom),
            molValidTo: formatDate(initialData.molValidTo),
        };
    }, [initialData]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });



    // ... (imports remain)

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            // Force country code to uppercase
            if (values.country) {
                values.country = values.country.toUpperCase();
            }

            const url = isEdit
                ? `/api/partner-agencies/${initialData.id}`
                : '/api/partner-agencies';

            if (isEdit) {
                await apiPatch(url, values);
            } else {
                await apiPost(url, values);
            }

            toast.success(isEdit ? '更新成功' : '建立成功');
            router.push('/partner-agencies');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || '儲存失敗');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* 1. Basic Info */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">基本資料 (Basic Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>代號 (Code) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: LBN01" className="bg-white" disabled={isEdit} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="agencyNameZh"
                            render={({ field }: { field: any }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>公司名稱-中文 (Name ZH) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="完整中文名稱" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="agencyNameEn"
                            render={({ field }: { field: any }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>公司名稱-英文 (Name EN)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="English Name" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>國別代碼 (Country Code)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="VN, ID, PH, TH" maxLength={2} className="bg-white uppercase" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 2. Contact Info */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">聯絡資訊 (Contact)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>電話 (Phone)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="fax"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>傳真 (Fax)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>E-mail</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addressZh"
                            render={({ field }: { field: any }) => (
                                <FormItem className="md:col-span-3">
                                    <FormLabel>公司地址-中文 (Address ZH)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addressEn"
                            render={({ field }: { field: any }) => (
                                <FormItem className="md:col-span-3">
                                    <FormLabel>公司地址-英文 (Address EN)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPerson"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>聯絡人 (Contact Person)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>聯絡電話 (Contact Phone)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 3. License & Registration */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">證照與許可 (License & Permits)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                            control={form.control}
                            name="permitNumber"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>公司許可證號 (Permit No.)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="foreignLicenseNo"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>國外執照編號 (Foreign License)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="foreignLicenseExpiry"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>國外執照效期 (Expiry)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="molPermitNo"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>勞動部許可編號 (MOL Permit)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="molValidFrom"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>勞動部認可起日 (Valid From)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="molValidTo"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>勞動部認可迄日 (Valid Until)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 4. Bank Info */}
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">銀行帳戶 (Bank Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="bankName"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>銀行名稱 (Bank Name)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="payeeName"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>受款人 (Payee Name)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankAccountNo"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>銀行帳號 (Account No.)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bankAddress"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>銀行地址 (Bank Address)</FormLabel>
                                    <FormControl>
                                        <Input {...field} className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        取消
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? '儲存中...' : '確認儲存'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
