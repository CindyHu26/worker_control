"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import {
    Briefcase,
    User,
    Phone,
    MapPin,
    Building,
    Globe,
    ArrowLeft,
    Save
} from 'lucide-react';

type LeadFormData = {
    companyName: string;
    contactPerson: string;
    taxId: string;
    status: string;
    phone: string;
    mobile: string;
    email: string;
    address: string;
    source: string;
    industry: string;
    estimatedWorkerCount: number;
};

export default function CreateLeadPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LeadFormData>({
        defaultValues: {
            industry: 'MANUFACTURING', // [Critical Fix] Standardized Default
            status: 'NEW'
        }
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    const onSubmit = async (data: LeadFormData) => {
        setIsSubmitting(true);
        try {
            // Ensure numbers are numbers
            const payload = {
                ...data,
                estimatedWorkerCount: Number(data.estimatedWorkerCount) || 0
            };

            await apiRequest('/api/leads', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            // Success: Redirect to board
            router.push('/crm/board');
            router.refresh();
        } catch (error: any) {
            console.error('Error:', error);
            alert(`建立失敗: ${error.message || '伺服器未回傳具體錯誤'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md border border-slate-100">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                新增潛在客戶
            </h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        公司名稱 (Company Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('companyName', { required: true })}
                        placeholder="例如：宏華精密工業"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {errors.companyName && <span className="text-red-500 text-xs">此欄位必填</span>}
                </div>

                {/* Tax ID */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        統一編號 (Tax ID)
                    </label>
                    <input
                        {...register('taxId')}
                        placeholder="例如：12345678"
                        maxLength={8}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Contact Person */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        聯絡人 (Contact Person)
                    </label>
                    <input
                        {...register('contactPerson')}
                        placeholder="例如：陳經理"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Mobile */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            手機 (Mobile)
                        </label>
                        <input
                            {...register('mobile')}
                            placeholder="0912-345-678"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            電話 (Phone)
                        </label>
                        <input
                            {...register('phone')}
                            placeholder="02-2345-6789"
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        電子郵件 (Email)
                    </label>
                    <input
                        {...register('email')}
                        type="email"
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                        地址 (Address)
                    </label>
                    <input
                        {...register('address')}
                        placeholder="完整公司地址"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Industry */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            產業別 (Industry Code)
                        </label>
                        <select
                            {...register('industry')}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="MANUFACTURING">製造業 (Manufacturing)</option>
                            <option value="CONSTRUCTION">營造業 (Construction)</option>
                            <option value="FISHERY">海洋漁撈 (Fishery)</option>
                            <option value="HOME_CARE">家庭看護 (Home Care)</option>
                            <option value="HOME_HELPER">家庭幫傭 (Home Helper)</option>
                            <option value="INSTITUTION">機構看護 (Institution)</option>
                            <option value="AGRICULTURE">農業 (Agriculture)</option>
                            <option value="SLAUGHTER">屠宰業 (Slaughter)</option>
                            <option value="OUTREACH_AGRICULTURE">外展農務 (Outreach Agriculture)</option>
                            <option value="HOSPITALITY">旅宿業 (Hospitality)</option>
                            <option value="OTHER">其他 (Other)</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/crm/board')}
                        className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        取消 (Cancel)
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSubmitting ? '建立中...' : '建立客戶'}
                    </button>
                </div>
            </form>
        </div>
    );
}
