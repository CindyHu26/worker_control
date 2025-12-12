"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function NewEmployerPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        companyName: '',
        taxId: '',
        responsiblePerson: '',
        phoneNumber: '',
        address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:3001/api/employers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '系統錯誤，請稍後再試');
            }

            // Success
            alert('新增成功');
            router.push('/employers');
            router.refresh();
        } catch (err: any) {
            setError(err.message || '系統錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/employers" className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} className="text-slate-600" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">新增雇主 (New Employer)</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">雇主資料</h2>
                        <p className="text-sm text-slate-500">請填寫雇主/公司的詳細資料。</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            雇主名稱 / 公司全銜 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            required
                            value={formData.companyName}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="e.g. 測試股份有限公司"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                統一編號 (Tax ID) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="taxId"
                                required
                                value={formData.taxId}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
                                placeholder="8碼數字"
                                maxLength={8}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                代表人 / 負責人
                            </label>
                            <input
                                type="text"
                                name="responsiblePerson"
                                value={formData.responsiblePerson}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                聯絡電話
                            </label>
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                placeholder="02-12345678"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            公司地址 / 戶籍地址
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="請填寫完整地址"
                        />
                    </div>

                    <div className="flex justify-end pt-6">
                        <Link
                            href="/employers"
                            className="px-6 py-2 mr-4 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            取消 (Cancel)
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {loading ? '儲存中...' : '儲存資料 (Save)'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
