"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, FormProvider } from 'react-hook-form';
import { Building2, CreditCard, ImageIcon, Save, X } from 'lucide-react';
import AddressInput from '@/components/common/AddressInput';
import { apiPost, apiPut } from '@/lib/api';
import { toast } from 'sonner';

interface AgencyFormData {
    id?: string;
    name: string;
    licenseNo: string;
    taxId: string;
    responsiblePerson: string;

    // Address Fields
    zipCode?: string;
    city?: string;
    district?: string;
    addressDetail?: string;
    fullAddress?: string;
    address?: string; // Legacy/Fallback

    phone?: string;
    fax?: string;
    email?: string;
    isDefault: boolean;
    agencyCode?: string;
    licenseExpiryDate?: string;

    nameEn?: string;
    addressEn?: string;
    representativeEn?: string;

    bankName?: string;
    bankCode?: string;
    bankBranch?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    sealLargeUrl?: string;
    sealSmallUrl?: string;
    logoUrl?: string;
}

interface AgencyFormProps {
    initialData?: Partial<AgencyFormData>;
    mode: 'create' | 'edit';
}

export default function AgencyForm({ initialData, mode }: AgencyFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const methods = useForm<AgencyFormData>({
        defaultValues: {
            name: '',
            licenseNo: '',
            taxId: '',
            responsiblePerson: '',
            isDefault: false,
            // Merge initial
            ...initialData,
            // Ensure address keys exist if initialData has partial address
            city: initialData?.city || '',
            district: initialData?.district || '',
            zipCode: initialData?.zipCode || '',
            addressDetail: initialData?.addressDetail || '',
            fullAddress: initialData?.fullAddress || initialData?.address || '',
            addressEn: initialData?.addressEn || '',
        }
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = methods;

    const onSubmit = async (data: AgencyFormData) => {
        setLoading(true);
        setError(null);

        try {
            const url = mode === 'create'
                ? '/api/settings/agency-companies'
                : `/api/settings/agency-companies/${initialData?.id}`;

            // Ensure address is synced if needed
            // Backend expects data, AddressInput populates fields directly.

            if (mode === 'create') {
                await apiPost(url, data);
            } else {
                await apiPut(url, data);
            }

            toast.success(mode === 'create' ? '新增成功' : '儲存成功');
            router.push('/settings/agencies');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
            toast.error('儲存失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="max-w-7xl mx-auto p-8 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {mode === 'create' ? '新增公司資料' : '編輯公司資料'}
                        </h1>
                        <p className="text-gray-500 mt-1">填寫完整的公司資訊以便開立發票與合約</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                        >
                            <X size={18} />
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 flex items-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? '儲存中...' : '儲存'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* 2-Column Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT COLUMN: Basic Registration Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                            <Building2 className="text-blue-600" size={24} />
                            <h2 className="text-xl font-bold text-gray-900">基本登記資料</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium text-gray-700">公司名稱 *</label>
                                <input
                                    {...register('name', { required: true })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">負責人 *</label>
                                <input
                                    {...register('responsiblePerson', { required: true })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">統一編號 *</label>
                                <input
                                    {...register('taxId', { required: true })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">許可證號 *</label>
                                <input
                                    {...register('licenseNo', { required: true })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">機構代碼</label>
                                <input
                                    {...register('agencyCode')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">許可證到期日</label>
                                <input
                                    type="date"
                                    {...register('licenseExpiryDate')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">電話</label>
                                <input
                                    {...register('phone')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">電子郵件</label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 pt-2">
                            <h3 className="text-sm font-bold text-gray-900 mb-2">地址資訊</h3>
                            <AddressInput
                                zipField="zipCode"
                                cityField="city"
                                districtField="district"
                                detailField="addressDetail"
                                fullAddressField="fullAddress"
                                englishAddressField="addressEn"
                            />
                        </div>

                        <div className="pt-4 border-t space-y-3">
                            <h3 className="text-sm font-bold text-gray-900">英文資料 (Bilingual Info)</h3>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">English Name</label>
                                <input
                                    {...register('nameEn')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                            {/* English Address is handled by AddressInput above, but if we want to show it explicitly here again? 
                                AddressInput already displays an English Address input field.
                                So we don't need a duplicate input here. 
                             */}

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Representative (EN)</label>
                                <input
                                    {...register('representativeEn')}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    {...register('isDefault')}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">設為預設公司</span>
                            </label>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Banking & Assets */}
                    <div className="space-y-6">
                        {/* Banking Information */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                <CreditCard className="text-green-600" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">銀行帳戶資訊</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">銀行名稱</label>
                                    <input
                                        {...register('bankName')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">銀行代碼</label>
                                    <input
                                        {...register('bankCode')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-gray-700">分行名稱</label>
                                    <input
                                        {...register('bankBranch')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-gray-700">銀行帳號</label>
                                    <input
                                        {...register('bankAccountNo')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-sm font-medium text-gray-700">戶名</label>
                                    <input
                                        {...register('bankAccountName')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Official Seals & Assets */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                                <ImageIcon className="text-purple-600" size={24} />
                                <h2 className="text-xl font-bold text-gray-900">官方印章與資產</h2>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">公司大章 URL</label>
                                    <input
                                        {...register('sealLargeUrl')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">負責人小章 URL</label>
                                    <input
                                        {...register('sealSmallUrl')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">公司 Logo URL</label>
                                    <input
                                        {...register('logoUrl')}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-dashed text-center">
                                <p className="text-sm text-gray-500">
                                    (註:即將支援檔案上傳功能,目前僅支援圖片連結)
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </FormProvider>
    );
}
