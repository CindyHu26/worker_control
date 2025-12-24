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

const formSchema = z.object({
    code: z.string().min(1, 'Code is required').max(20),
    nameZh: z.string().min(1, 'Chinese name is required').max(50),
    nameEn: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface EmployerCategoryFormProps {
    initialData?: FormValues & { id: string };
    isEdit?: boolean;
}

export function EmployerCategoryForm({ initialData, isEdit = false }: EmployerCategoryFormProps) {
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
            nameZh: '',
            nameEn: '',
            sortOrder: 0,
            isActive: true,
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                code: initialData.code || '',
                nameZh: initialData.nameZh || '',
                nameEn: initialData.nameEn || '',
                sortOrder: initialData.sortOrder || 0,
                isActive: initialData.isActive ?? true,
            });
        }
    }, [initialData, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `/api/employer-categories/${initialData.id}`
                : '/api/employer-categories';

            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                throw new Error('儲存雇主類別失敗');
            }

            toast.success(isEdit ? '雇主類別更新成功' : '雇主類別建立成功');
            router.push('/employer-categories');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle>{isEdit ? '編輯雇主類別' : '新增雇主類別'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Code */}
                        <div className="space-y-2">
                            <Label htmlFor="code">代碼 (Code) <span className="text-red-500">*</span></Label>
                            <Input
                                id="code"
                                placeholder="例如：MANUFACTURING"
                                {...register('code')}
                                className="bg-white"
                            />
                            {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                        </div>

                        {/* Name ZH */}
                        <div className="space-y-2">
                            <Label htmlFor="nameZh">中文名稱 (Name ZH) <span className="text-red-500">*</span></Label>
                            <Input
                                id="nameZh"
                                placeholder="例如：製造業"
                                {...register('nameZh')}
                                className="bg-white"
                            />
                            {errors.nameZh && <p className="text-sm text-red-500">{errors.nameZh.message}</p>}
                        </div>

                        {/* Name EN */}
                        <div className="space-y-2">
                            <Label htmlFor="nameEn">英文名稱 (Name EN)</Label>
                            <Input
                                id="nameEn"
                                placeholder="例如：Manufacturing"
                                {...register('nameEn')}
                                className="bg-white"
                            />
                            {errors.nameEn && <p className="text-sm text-red-500">{errors.nameEn.message}</p>}
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-2">
                            <Label htmlFor="sortOrder">排序 (Sort Order)</Label>
                            <Input
                                type="number"
                                id="sortOrder"
                                {...register('sortOrder', { valueAsNumber: true })}
                                className="bg-white"
                            />
                            {errors.sortOrder && <p className="text-sm text-red-500">{errors.sortOrder.message}</p>}
                        </div>

                        {/* Is Active */}
                        <div className="flex flex-col justify-end pb-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="isActive"
                                    checked={!!initialData?.isActive} // this might be tricky with uncontrolled, better use controller if needed but register works for native checkbox mostly if handled right.
                                    // For shadcn Checkbox, it's controlled. We need Controller or manual handling.
                                    // Let's use Controller concepts or just simple native checkbox if easier.
                                    // But I should use standardized components.
                                    // onCheckedChange={val => setValue('isActive', val as boolean)}
                                    // defaultChecked={true}
                                    onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
                                    defaultChecked={initialData?.isActive ?? true}
                                />
                                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                                    啟用狀態 (Is Active)
                                </Label>
                            </div>
                        </div>

                    </div>

                    <div className="flex justify-end gap-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            取消
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isEdit ? '更新類別' : '建立類別'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
