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
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const formSchema = z.object({
    code: z.string().min(1, '代碼為必填').max(10, '代碼最多10字元'),
    nameZh: z.string().min(1, '中文名稱為必填').max(50, '名稱最多50字元'),
    nameEn: z.string().max(50, '英文名稱最多50字元').optional().nullable(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface CountryFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function CountryForm({ initialData, isEdit = false }: CountryFormProps) {
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
                ? `/api/countries/${initialData.id}`
                : '/api/countries';

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
            router.push('/countries');
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
                        <CardTitle className="text-lg">國別資料 (Country Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Row 1 */}
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>國別代碼 (Code) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: PH, VN" className="bg-white" disabled={isEdit} />
                                    </FormControl>
                                    <FormDescription>ISO 代碼，例如 PH (菲律賓), VN (越南)</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sortOrder"
                            render={({ field }) => (
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
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>中文國名 (Name ZH) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: 菲律賓" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="nameEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>英文國名 (Name EN)</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value || ''} placeholder="例如: Philippines" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Active Checkbox */}
                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
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
                                        <FormDescription>
                                            是否開放此國別的勞工引進
                                        </FormDescription>
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
