"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CreditCard, ImageIcon, Save, X } from 'lucide-react';
import AddressInput from '@/components/ui/AddressInput';

interface AgencyFormData {
    id?: string;
    name: string;
    licenseNo: string;
    taxId: string;
    responsiblePerson: string;
    address?: string;
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

import { apiPost, apiPut } from '@/lib/api';

// ... (imports remain)

export default function AgencyForm({ initialData, mode }: AgencyFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState<AgencyFormData>({
        name: '',
        licenseNo: '',
        taxId: '',
        responsiblePerson: '',
        isDefault: false,
        ...initialData
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = mode === 'create'
                ? '/api/settings/agency-companies'
                : `/api/settings/agency-companies/${formData.id}`;

            if (mode === 'create') {
                await apiPost(url, formData);
            } else {
                await apiPut(url, formData);
            }

            router.push('/settings/agencies');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleTranslateAddress = async (chineseAddress: string): Promise<string> => {
        try {
            const data = await apiPost<{ english: string }>('/api/address/translate', { address: chineseAddress });
            if (data.english) {
                setFormData(prev => ({ ...prev, addressEn: data.english }));
                return data.english;
            }
            return '';
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto p-8 space-y-6">
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
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">負責人 *</label>
                            <input
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.responsiblePerson}
                                onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">統一編號 *</label>
                            <input
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.taxId}
                                onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">許可證號 *</label>
                            <input
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.licenseNo}
                                onChange={e => setFormData({ ...formData, licenseNo: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">機構代碼</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.agencyCode || ''}
                                onChange={e => setFormData({ ...formData, agencyCode: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">許可證到期日</label>
                            <input
                                type="date"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.licenseExpiryDate?.split('T')[0] || ''}
                                onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">電話</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.phone || ''}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">電子郵件</label>
                            <input
                                type="email"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.email || ''}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <AddressInput
                            label="中文地址"
                            value={formData.address || ''}
                            onChange={(value) => setFormData({ ...formData, address: value })}
                            onTranslate={handleTranslateAddress}
                            placeholder="例：台北市大安區..."
                        />
                    </div>

                    <div className="pt-4 border-t space-y-3">
                        <h3 className="text-sm font-bold text-gray-900">英文資料 (Bilingual Info)</h3>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">English Name</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.nameEn || ''}
                                onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">English Address</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.addressEn || ''}
                                onChange={e => setFormData({ ...formData, addressEn: e.target.value })}
                                placeholder="Auto-filled by translation"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Representative (EN)</label>
                            <input
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                value={formData.representativeEn || ''}
                                onChange={e => setFormData({ ...formData, representativeEn: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={formData.bankName || ''}
                                    onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">銀行代碼</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={formData.bankCode || ''}
                                    onChange={e => setFormData({ ...formData, bankCode: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium text-gray-700">分行名稱</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={formData.bankBranch || ''}
                                    onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium text-gray-700">銀行帳號</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono"
                                    value={formData.bankAccountNo || ''}
                                    onChange={e => setFormData({ ...formData, bankAccountNo: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-sm font-medium text-gray-700">戶名</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={formData.bankAccountName || ''}
                                    onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })}
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.sealLargeUrl || ''}
                                    onChange={e => setFormData({ ...formData, sealLargeUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">負責人小章 URL</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.sealSmallUrl || ''}
                                    onChange={e => setFormData({ ...formData, sealSmallUrl: e.target.value })}
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">公司 Logo URL</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                    value={formData.logoUrl || ''}
                                    onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
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
    );
}
