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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const formSchema = z.object({
    code: z.string().min(1, '代碼為必填'),
    nameZh: z.string().min(1, '部門名稱(中)為必填'),
    nameEn: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface DepartmentFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function DepartmentForm({ initialData, isEdit = false }: DepartmentFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            code: '',
            nameZh: '',
            nameEn: '',
            sortOrder: 0,
            isActive: true,
        },
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const url = isEdit
                ? `/api/departments/${initialData.id}`
                : '/api/departments';

            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || '儲存失敗');
            }

            toast.success(isEdit ? '更新成功' : '建立成功');
            router.push('/departments');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg">部門資料 (Department Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Row 1 */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>部門代碼 (Code) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: HR, SALES" className="bg-white" disabled={isEdit} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sortOrder"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>排序 (Sort Order)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="number" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Row 2 */}
                        <FormField
                            control={form.control}
                            name="nameZh"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>部門名稱-中文 (Name ZH) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: 人力資源部" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nameEn"
                            render={({ field }: { field: any }) => (
                                <FormItem>
                                    <FormLabel>部門名稱-英文 (Name EN)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="e.g. Human Resources" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Row 3 - Checkbox */}
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }: { field: any }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-white">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            啟用 (Active)
                                        </FormLabel>
                                    </div>
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
