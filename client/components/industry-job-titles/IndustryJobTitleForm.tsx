'use client';

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { apiPost, apiPut, apiGet } from '@/lib/api';

const formSchema = z.object({
    industryId: z.string().min(1, '請選擇行業別'),
    titleZh: z.string().min(1, '職稱(中文)為必填').max(100),
    titleEn: z.string().max(100).optional().or(z.literal('')),
    titleTh: z.string().max(100).optional().nullable(),
    titleVn: z.string().max(100).optional().nullable(),
    titleId: z.string().max(100).optional().nullable(),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface IndustryJobTitleFormProps {
    initialData?: any;
    isEdit?: boolean;
}

interface IndustryOption {
    id: string;
    code: string;
    nameZh: string;
}

export default function IndustryJobTitleForm({ initialData, isEdit = false }: IndustryJobTitleFormProps) {
    const router = useRouter();
    const [industries, setIndustries] = useState<IndustryOption[]>([]);

    const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            industryId: initialData?.industryId || '',
            titleZh: initialData?.titleZh || '',
            titleEn: initialData?.titleEn || '',
            titleTh: initialData?.titleTh || '',
            titleVn: initialData?.titleVn || '',
            titleId: initialData?.titleId || '',
            isActive: initialData?.isActive ?? true,
        },
    });

    useEffect(() => {
        const fetchIndustries = async () => {
            try {
                const data = await apiGet('http://localhost:3001/api/industries?pageSize=1000'); // Fetch all for dropdown
                setIndustries(data.data || []);
            } catch (error) {
                console.error('Failed to fetch industries:', error);
                toast.error('無法載入行業別資料');
            }
        };
        fetchIndustries();
    }, []);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `http://localhost:3001/api/industry-job-titles/${initialData.id}`
                : 'http://localhost:3001/api/industry-job-titles';

            // Convert empty strings to null for optional fields if needed, 
            // but Zod handles optional().nullable() with empty strings if we don't force it.
            // Actually, Zod string() doesn't accept null unless .nullable().
            // Ideally we pass undefined or valid values.

            if (isEdit) {
                await apiPut(url, values);
                toast.success('行業職稱更新成功');
            } else {
                await apiPost(url, values);
                toast.success('行業職稱建立成功');
            }

            router.push('/industry-job-titles');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{isEdit ? '編輯行業職稱' : '新增行業職稱'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Industry Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="industryId">所屬行業別 <span className="text-red-500">*</span></Label>
                            <Controller
                                name="industryId"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue placeholder="選擇行業別" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {industries.map((ind) => (
                                                <SelectItem key={ind.id} value={ind.id}>
                                                    {ind.code} - {ind.nameZh}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.industryId && <p className="text-sm text-red-500">{errors.industryId.message}</p>}
                        </div>

                        {/* Title ZH */}
                        <div className="space-y-2">
                            <Label htmlFor="titleZh">職稱 (中文) <span className="text-red-500">*</span></Label>
                            <Controller
                                name="titleZh"
                                control={control}
                                render={({ field }) => (
                                    <Input id="titleZh" placeholder="輸入中文職稱" {...field} className="bg-white" />
                                )}
                            />
                            {errors.titleZh && <p className="text-sm text-red-500">{errors.titleZh.message}</p>}
                        </div>

                        {/* Title EN */}
                        <div className="space-y-2">
                            <Label htmlFor="titleEn">職稱 (英文)</Label>
                            <Controller
                                name="titleEn"
                                control={control}
                                render={({ field }) => (
                                    <Input id="titleEn" placeholder="Job Title (English)" {...field} value={field.value || ''} className="bg-white" />
                                )}
                            />
                        </div>

                        {/* Title TH */}
                        <div className="space-y-2">
                            <Label htmlFor="titleTh">職稱 (泰文)</Label>
                            <Controller
                                name="titleTh"
                                control={control}
                                render={({ field }) => (
                                    <Input id="titleTh" placeholder="Job Title (Thai)" {...field} value={field.value || ''} className="bg-white" />
                                )}
                            />
                        </div>

                        {/* Title VN */}
                        <div className="space-y-2">
                            <Label htmlFor="titleVn">職稱 (越文)</Label>
                            <Controller
                                name="titleVn"
                                control={control}
                                render={({ field }) => (
                                    <Input id="titleVn" placeholder="Job Title (Vietnamese)" {...field} value={field.value || ''} className="bg-white" />
                                )}
                            />
                        </div>

                        {/* Title ID */}
                        <div className="space-y-2">
                            <Label htmlFor="titleId">職稱 (印文)</Label>
                            <Controller
                                name="titleId"
                                control={control}
                                render={({ field }) => (
                                    <Input id="titleId" placeholder="Job Title (Indonesian)" {...field} value={field.value || ''} className="bg-white" />
                                )}
                            />
                        </div>

                        {/* Is Active */}
                        <div className="flex flex-row items-center space-x-3 rounded-md border p-4 bg-white md:col-span-2">
                            <Controller
                                name="isActive"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        id="isActive"
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                )}
                            />
                            <Label htmlFor="isActive" className="cursor-pointer">啟用狀態</Label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            取消
                        </Button>
                        <Button type="submit">
                            {isEdit ? '儲存變更' : '建立職稱'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
