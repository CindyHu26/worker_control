"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Schema
const reportSchema = z.object({
    deploymentId: z.string().uuid({ message: 'Ë´ãÈÅ∏?áÁßªÂ∑?(Please select a worker)' }),
    missingDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Ë´ãËº∏?•Ê??àÊó•?? }),
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
            <label className="block text-sm font-medium text-slate-700">?úÂ?ÁßªÂ∑• (Search Worker)</label>
            <div className="flex gap-2">
                <input
                    className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Ëº∏ÂÖ•ÂßìÂ??ñË≠∑?ßË?Á¢?.."
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
                                    alert('Ê≠§ÁßªÂ∑•ÁÑ°?âÊ?Ê¥æÂ∑• (No active deployment)');
                                }
                            }}
                        >
                            <span className="font-bold">{item.nameZh}</span> <span className="text-slate-500">{item.nameEn}</span>
                            <div className="text-xs text-slate-400">?á‰∏ª: {item.employerName}</div>
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
            alert('?öÂ†±Â§±Ê? (Failed to report)');
        }
    };

    return (
        <StandardPageLayout
            title="?öÂ†±Â§±ËÅØ (Report Missing Worker)"
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
                                        <div className="text-sm text-blue-600 font-bold mb-1">Â∑≤ÈÅ∏?áÁßªÂ∑?(Selected):</div>
                                        <div className="font-medium text-slate-900">{selectedWorkerName}</div>
                                    </div>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        setValue('deploymentId', '');
                                        setSelectedWorkerName('');
                                    }}>?çÈÅ∏</Button>
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
                            <label className="block text-sm font-medium text-slate-700">Â§±ËÅØ?•Ê? (Missing Date)</label>
                            <input
                                type="date"
                                {...register('missingDate')}
                                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            {errors.missingDate && <p className="text-red-500 text-sm mt-1">{errors.missingDate.message}</p>}
                        </div>

                        {/* Three Day Countdown Note */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">3?•ÈÄöÂ†±?íÊï∏ (Countdown Start)</label>
                            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-500 text-sm">
                                Á≥ªÁµ±Â∞áËá™?ïÂ?Â§±ËÅØ?•Ê??ãÂ?Ë®àÁ??öÂ†±?üÈ? (System auto-calculates from Missing Date)
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="block text-sm font-medium text-slate-700">?ôË®ª (Notes)</label>
                            <textarea
                                {...register('notes')}
                                className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32"
                                placeholder="Ë´ãËº∏?•Áõ∏?úÊ?Ê≥ÅÊ?Ëø?.."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => router.back()}>?ñÊ? (Cancel)</Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
                            Á¢∫Ë??öÂ†± (Confirm Report)
                        </Button>
                    </div>
                </div>
            </form>
        </StandardPageLayout>
    );
}
