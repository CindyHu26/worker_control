"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, User } from 'lucide-react';
import Link from 'next/link';

export default function EditWorkerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        englishName: '',
        chineseName: '',
        nationality: '',
        dob: '',
        mobilePhone: '',
        foreignAddress: ''
    });

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const res = await fetch(`http://localhost:3001/api/workers/${params.id}`);
                if (!res.ok) throw new Error('Worker not found');
                const data = await res.json();

                setFormData({
                    englishName: data.englishName || '',
                    chineseName: data.chineseName || '',
                    nationality: data.nationality || '',
                    dob: data.dob ? data.dob.split('T')[0] : '',
                    mobilePhone: data.mobilePhone || '',
                    foreignAddress: data.foreignAddress || ''
                });
            } catch (err: any) {
                setError(err.message || '系統錯誤');
            } finally {
                setLoading(false);
            }
        };

        fetchWorker();
    }, [params.id]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`http://localhost:3001/api/workers/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || '系統錯誤，請稍後再試');
            }

            // Success
            alert('更新成功');
            router.push(`/workers/${params.id}`);
            router.refresh();
        } catch (err: any) {
            setError(err.message || '系統錯誤，請稍後再試');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">載入中...</div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href={`/workers/${params.id}`} className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} className="text-slate-600" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900">編輯移工資料 (Edit Worker)</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-100">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">基本資料 (Basic Info)</h2>
                        <p className="text-sm text-slate-500">更新移工的個人詳細資料。</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Names */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                英文姓名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="englishName"
                                required
                                value={formData.englishName}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                中文姓名
                            </label>
                            <input
                                type="text"
                                name="chineseName"
                                value={formData.chineseName}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Nationality & DOB */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                國籍 <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                            >
                                <option value="Indonesia">印尼 (Indonesia)</option>
                                <option value="Vietnam">越南 (Vietnam)</option>
                                <option value="Philippines">菲律賓 (Philippines)</option>
                                <option value="Thailand">泰國 (Thailand)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                出生日期 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="dob"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                手機號碼
                            </label>
                            <input
                                type="tel"
                                name="mobilePhone"
                                value={formData.mobilePhone}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                國外地址
                            </label>
                            <input
                                type="text"
                                name="foreignAddress"
                                value={formData.foreignAddress}
                                onChange={handleChange}
                                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Link
                            href={`/workers/${params.id}`}
                            className="px-6 py-2 mr-4 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                            取消 (Cancel)
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {saving ? '儲存中...' : '儲存資料 (Save Changes)'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
