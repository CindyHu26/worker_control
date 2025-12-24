'use client';

import React, { useEffect, useState } from 'react';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const formSchema = z.object({
    agencyId: z.string().min(1, '請選擇國外仲介'),
    contractNo: z.string().min(1, '合約編號為必填'),
    contractType: z.string().optional(),

    // Dates as strings
    signedDate: z.string().optional(),
    validFrom: z.string().optional(),
    validTo: z.string().optional(),

    summary: z.string().optional(),
    status: z.string().optional(), // ACTIVE, EXPIRED, TERMINATED
});

type FormValues = z.infer<typeof formSchema>;

interface PartnerAgencyContractFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function PartnerAgencyContractForm({ initialData, isEdit = false }: PartnerAgencyContractFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [agencies, setAgencies] = useState<any[]>([]);

    // Fetch Agencies for Dropdown
    useEffect(() => {
        const fetchAgencies = async () => {
            const res = await fetch('/api/partner-agencies?limit=100');
            const data = await res.json();
            setAgencies(data.data || []);
        };
        fetchAgencies();
    }, []);

    const defaultValues: Partial<FormValues> = React.useMemo(() => {
        const formatDate = (date: string | null) => date ? new Date(date).toISOString().split('T')[0] : '';
        return {
            agencyId: initialData?.agencyId || '',
            contractNo: initialData?.contractNo || '',
            contractType: initialData?.contractType || '',
            signedDate: formatDate(initialData?.signedDate),
            validFrom: formatDate(initialData?.validFrom),
            validTo: formatDate(initialData?.validTo),
            summary: initialData?.summary || '',
            status: initialData?.status || 'ACTIVE',
        };
    }, [initialData]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const url = isEdit
                ? `/api/partner-agency-contracts/${initialData.id}`
                : '/api/partner-agency-contracts';

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
            router.push('/partner-agency-contracts');
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
                        <CardTitle className="text-lg">合約基本資料 (Contract Info)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Agency Selector */}
                        <FormField
                            control={form.control}
                            name="agencyId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>國外仲介 (Partner Agency) <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isEdit} // Usually contract owner doesn't change
                                    >
                                        <FormControl>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="請選擇仲介" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {agencies.map((agency) => (
                                                <SelectItem key={agency.id} value={agency.id}>
                                                    {agency.code} - {agency.agencyNameZh}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contractNo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>合約編號 (Contract No.) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: VN-2023-001" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="contractType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>合約類型 (Type)</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="例如: 互貿協定" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>合約狀態 (Status)</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white">
                                                <SelectValue placeholder="選擇狀態" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="ACTIVE">有效 (ACTIVE)</SelectItem>
                                            <SelectItem value="EXPIRED">過期 (EXPIRED)</SelectItem>
                                            <SelectItem value="TERMINATED">終止 (TERMINATED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Dates Row */}
                        <FormField
                            control={form.control}
                            name="signedDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>簽約日期 (Signed Date)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="hidden md:block"></div> {/* Spacer */}

                        <FormField
                            control={form.control}
                            name="validFrom"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>生效日期 (Valid From)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="validTo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>到期日期 (Valid To)</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="date" className="bg-white" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="summary"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>合約摘要 (Summary)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} className="bg-white resize-none" rows={3} />
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
