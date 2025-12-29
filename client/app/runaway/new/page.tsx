"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema
const reportSchema = z.object({
    deploymentId: z.string().uuid({ message: '請選擇移工 (Please select a worker)' }),
    missingDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: '請輸入有效日期' }),
    notes: z.string().optional()
});

type ReportForm = z.infer<typeof reportSchema>;

// Mock Search Component (Simplified)
// In a real app, this would be a Combobox or AsyncSelect
function DeploymentSearch({ onSelect }: { onSelect: (id: string, name: string) => void }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    const handleSearch = async () => {
        if (!query) return;
        setSearching(true);
        try {
            // Search Active Deployments
            const res = await fetch(`/api/search/workers?q=${query}&status=active`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">搜尋移工 (Search Worker)</label>
            <div className="flex gap-2">
                <input
                    className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="輸入姓名或護照號碼..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={handleSearch} disabled={searching}>
                    <Search size={16} />
                </Button>
            </div>
            {results.length > 0 && (
                <div className="border rounded-md max-h-40 overflow-y-auto bg-white shadow-sm mt-2">
                    {results.map((item: any) => (
                        <div
                            key={item.currentDeployment?.id || item.id}
                            className="p-2 hover:bg-slate-50 cursor-pointer text-sm border-b last:border-0"
                            onClick={() => {
                                if (item.currentDeployment?.id) {
                                    onSelect(item.currentDeployment.id, `${item.nameZh} (${item.employerName})`);
                                    setResults([]);
                                } else {
                                    alert('此移工無有效派工 (No active deployment)');
                                }
                            }}
                        >
                            <span className="font-bold">{item.nameZh}</span> <span className="text-slate-500">{item.nameEn}</span>
                            <div className="text-xs text-slate-400">雇主: {item.employerName}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NewRunawayPage() {
    const router = useRouter();
    const [selectedWorkerName, setSelectedWorkerName] = useState<string>('');

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ReportForm>({
        resolver: zodResolver(reportSchema)
    });

    const onSubmit = async (data: ReportForm) => {
        try {
            const res = await fetch('/api/runaways', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to create report');

            router.push('/runaway');
        } catch (error) {
            console.error(error);
            alert('通報失敗 (Failed to report)');
        }
    };

    return (
        <PageContainer
            title="通報失聯 (Report Missing Worker)"
            showBack
            onBack={() => router.back()}
            maxWidth="lg" // Limit width for form
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pr-6">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Worker Selection */}
                        <div className="col-span-1 md:col-span-2">
                            {selectedWorkerName ? (
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md flex justify-between items-center">
                                    <div>
                                        <div className="text-sm text-blue-600 font-bold mb-1">已選擇移工 (Selected):</div>
                                        <div className="font-medium text-slate-900">{selectedWorkerName}</div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        setValue('deploymentId', '');
                                        setSelectedWorkerName('');
                                    }}>重選</Button>
                                </div>
                            ) : (
                                <DeploymentSearch onSelect={(id, name) => {
                                    setValue('deploymentId', id);
                                    setSelectedWorkerName(name);
                                }} />
                            )}
                            {errors.deploymentId && <p className="text-red-500 text-sm mt-1">{errors.deploymentId.message}</p>}
                        </div>

                        {/* Missing Date */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">失聯日期 (Missing Date)</label>
                            <input
                                type="date"
                                {...register('missingDate')}
                                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {errors.missingDate && <p className="text-red-500 text-sm mt-1">{errors.missingDate.message}</p>}
                        </div>

                        {/* Three Day Countdown Note */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">3日通報倒數 (Countdown Start)</label>
                            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 text-sm">
                                系統將自動從失聯日期開始計算通報期限 (System auto-calculates from Missing Date)
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-slate-700">備註 (Notes)</label>
                            <textarea
                                {...register('notes')}
                                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32"
                                placeholder="請輸入相關情況描述..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => router.back()}>取消 (Cancel)</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                            確認通報 (Confirm Report)
                        </Button>
                    </div>
                </div>
            </form>
        </PageContainer>
    );
}
