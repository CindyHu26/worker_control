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
    code: z.string().min(1, '行業代碼為必填').max(10),
    category: z.string().max(5).optional(),
    nameZh: z.string().min(1, '中文名稱為必填').max(100),
    nameEn: z.string().max(100).optional(),
    nameTh: z.string().max(100).optional(),
    nameVn: z.string().max(100).optional(),
    nameId: z.string().max(100).optional(),
    isOpen: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface IndustryFormProps {
    initialData?: FormValues & { id: string };
    isEdit?: boolean;
}

export function IndustryForm({ initialData, isEdit = false }: IndustryFormProps) {
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
            category: '',
            nameZh: '',
            nameEn: '',
            nameTh: '',
            nameVn: '',
            nameId: '',
            isOpen: true,
            ...initialData,
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    const onSubmit = async (values: FormValues) => {
        try {
            const url = isEdit && initialData
                ? `/api/industries/${initialData.id}`
                : '/api/industries';

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
                throw new Error('儲存行業別失敗');
            }

            toast.success(isEdit ? '行業別更新成功' : '行業別建立成功');
            router.push('/industries');
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error("發生錯誤，請稍後再試");
        }
    };

    return (
        <Card className="w-full max-w-5xl mx-auto shadow-md">
            <CardHeader>
                <CardTitle>{isEdit ? '編輯行業別' : '新增行業別'}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                    {/* 基本資訊 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">基本資訊</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="code">行業代碼 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="code"
                                    placeholder="例如：0116"
                                    {...register('code')}
                                    className="bg-white"
                                />
                                {errors.code && <p className="text-sm text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">行業類別</Label>
                                <Input
                                    id="category"
                                    placeholder="例如：A"
                                    {...register('category')}
                                    className="bg-white"
                                    maxLength={5}
                                />
                                {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                            </div>

                            <div className="flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="isOpen"
                                        onCheckedChange={(checked) => setValue('isOpen', checked as boolean)}
                                        defaultChecked={initialData?.isOpen ?? true}
                                    />
                                    <Label htmlFor="isOpen" className="font-normal cursor-pointer">
                                        開放引進
                                    </Label>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 多語言名稱 */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">多語言名稱</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="nameZh">中文名稱 <span className="text-red-500">*</span></Label>
                                <Input
                                    id="nameZh"
                                    placeholder="例如：食用菇蕈栽培業"
                                    {...register('nameZh')}
                                    className="bg-white"
                                />
                                {errors.nameZh && <p className="text-sm text-red-500">{errors.nameZh.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameEn">英文名稱</Label>
                                <Input
                                    id="nameEn"
                                    placeholder="例如：Growing of Mushrooms"
                                    {...register('nameEn')}
                                    className="bg-white"
                                />
                                {errors.nameEn && <p className="text-sm text-red-500">{errors.nameEn.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameTh">泰文名稱</Label>
                                <Input
                                    id="nameTh"
                                    placeholder="泰文名稱（選填）"
                                    {...register('nameTh')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameVn">越南文名稱</Label>
                                <Input
                                    id="nameVn"
                                    placeholder="越南文名稱（選填）"
                                    {...register('nameVn')}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="nameId">印尼文名稱</Label>
                                <Input
                                    id="nameId"
                                    placeholder="印尼文名稱（選填）"
                                    {...register('nameId')}
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
                            {isEdit ? '更新行業別' : '建立行業別'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
