"use client";

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { CreateBankInputSchema, UpdateBankInputSchema } from '@worker-control/shared';
import type { CreateBankInput, UpdateBankInput, BankResponse } from '@worker-control/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AddressInput from '@/components/common/AddressInput';

interface BankFormProps {
    initialData?: BankResponse;
    isEdit?: boolean;
}

export default function BankForm({ initialData, isEdit = false }: BankFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const methods = useForm<CreateBankInput>({
        resolver: zodResolver(isEdit ? UpdateBankInputSchema : CreateBankInputSchema),
        defaultValues: initialData ? {
            code: initialData.code,
            bankName: initialData.bankName,
            bankNameEn: initialData.bankNameEn || '',
            contactPerson: initialData.contactPerson || '',
            phone: initialData.phone || '',
            fax: initialData.fax || '',
            // Address Fields
            zipCode: initialData.zipCode || '',
            city: initialData.city || '',
            district: initialData.district || '',
            addressDetail: initialData.addressDetail || '',
            fullAddress: initialData.fullAddress || initialData.address || '',
            fullAddressEn: initialData.fullAddressEn || '',
            // Legacy
            address: initialData.address || '',

            notes: initialData.notes || '',
            isActive: initialData.isActive
        } : {
            code: '',
            bankName: '',
            bankNameEn: '',
            contactPerson: '',
            phone: '',
            fax: '',
            zipCode: '',
            city: '',
            district: '',
            addressDetail: '',
            fullAddress: '',
            fullAddressEn: '',
            address: '',
            notes: '',
            isActive: true
        }
    });

    const { register, handleSubmit, formState: { errors } } = methods;

    const onSubmit = async (data: CreateBankInput) => {
        setLoading(true);
        try {
            const url = isEdit ? `/api/banks/${initialData?.id}` : '/api/banks';
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || errorData.error || 'Failed to save');
            }

            toast.success(isEdit ? '更新成功 (Updated successfully)' : '建立成功 (Created successfully)');
            router.push('/banks');
            router.refresh();
        } catch (error: any) {
            console.error(error);
            toast.error(`儲存失敗: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        if (!confirm('確定要刪除此銀行資料嗎？此動作無法復原。Data will be deleted permanently.')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/banks/${initialData?.id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || err.error || 'Deletion failed');
            }

            toast.success('刪除成功 (Deleted successfully)');
            router.push('/banks');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <Card className="border-slate-200 shadow-sm max-w-4xl mx-auto">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg text-slate-800 flex items-center gap-2">
                    {isEdit ? '編輯銀行 (Edit Bank)' : '新增銀行 (New Bank)'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-8">
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Info */}
                            <div className="space-y-2">
                                <Label htmlFor="code" className="text-slate-700 font-medium">銀行代號 (Bank Code) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="code"
                                    {...register('code')}
                                    className="bg-white border-slate-300 focus:ring-blue-500"
                                    placeholder="e.g. 004, 822"
                                    disabled={loading}
                                />
                                {errors.code && <p className="text-red-500 text-sm">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bankName" className="text-slate-700 font-medium">銀行名稱 (Bank Name) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="bankName"
                                    {...register('bankName')}
                                    className="bg-white border-slate-300 focus:ring-blue-500"
                                    placeholder="e.g. 臺灣銀行"
                                    disabled={loading}
                                />
                                {errors.bankName && <p className="text-red-500 text-sm">{errors.bankName.message}</p>}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="bankNameEn" className="text-slate-700 font-medium">英文名稱 (English Name)</Label>
                                <Input
                                    id="bankNameEn"
                                    {...register('bankNameEn')}
                                    className="bg-white border-slate-300 focus:ring-blue-500"
                                    placeholder="e.g. Bank of Taiwan"
                                    disabled={loading}
                                />
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2">
                                <Label htmlFor="contactPerson" className="text-slate-700 font-medium">聯絡人 (Contact Person)</Label>
                                <Input
                                    id="contactPerson"
                                    {...register('contactPerson')}
                                    className="bg-white border-slate-300"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-slate-700 font-medium">電話 (Phone)</Label>
                                <Input
                                    id="phone"
                                    {...register('phone')}
                                    className="bg-white border-slate-300"
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fax" className="text-slate-700 font-medium">傳真 (Fax)</Label>
                                <Input
                                    id="fax"
                                    {...register('fax')}
                                    className="bg-white border-slate-300"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                            <h3 className="font-medium text-slate-900">地址資訊 (Address)</h3>
                            <AddressInput
                                zipField="zipCode"
                                cityField="city"
                                districtField="district"
                                detailField="addressDetail"
                                fullAddressField="fullAddress"
                                englishAddressField="fullAddressEn"
                            />
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-700 font-medium">備註 (Notes)</Label>
                            <textarea
                                id="notes"
                                {...register('notes')}
                                className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                <X className="w-4 h-4 mr-2" /> 取消 (Cancel)
                            </Button>

                            <div className="flex items-center gap-3">
                                {isEdit && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={onDelete}
                                        disabled={loading}
                                        className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" /> 刪除 (Delete)
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                                >
                                    {loading ? '儲存中...' : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" />
                                            {isEdit ? '更新 (Update)' : '建立 (Create)'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </FormProvider>
            </CardContent>
        </Card>
    );
}
