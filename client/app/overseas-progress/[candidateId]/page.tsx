'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, FileText, AlertTriangle } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface FormData {
    // 海外體檢
    medicalExamDate: string;
    medicalExamResult: string;
    medicalExamRemarks: string;
    // 良民證
    policeClrDate: string;
    policeClrStatus: string;
    policeClrRemarks: string;
    // 護照
    passportChecked: boolean;
    passportExpiryOk: boolean;
    passportRemarks: string;
    // ARC
    arcChecked: boolean;
    arcHasIssues: boolean;
    arcRemarks: string;
}

interface CandidateInfo {
    id: string;
    nameZh: string;
    nameEn: string | null;
    passportNo: string;
    passportExpiry: string | null;
    nationality: string;
}

export default function OverseasProgressEditPage() {
    const router = useRouter();
    const params = useParams();
    const candidateId = params.candidateId as string;

    const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
    const [formData, setFormData] = useState<FormData>({
        medicalExamDate: '',
        medicalExamResult: '',
        medicalExamRemarks: '',
        policeClrDate: '',
        policeClrStatus: '',
        policeClrRemarks: '',
        passportChecked: false,
        passportExpiryOk: false,
        passportRemarks: '',
        arcChecked: false,
        arcHasIssues: false,
        arcRemarks: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProgress();
    }, [candidateId]);

    const fetchProgress = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overseas-progress/${candidateId}`, {
                credentials: 'include',
            });
            const data = await res.json();

            if (data.candidate) {
                setCandidate(data.candidate);
            }

            setFormData({
                medicalExamDate: data.medicalExamDate ? data.medicalExamDate.split('T')[0] : '',
                medicalExamResult: data.medicalExamResult || '',
                medicalExamRemarks: data.medicalExamRemarks || '',
                policeClrDate: data.policeClrDate ? data.policeClrDate.split('T')[0] : '',
                policeClrStatus: data.policeClrStatus || '',
                policeClrRemarks: data.policeClrRemarks || '',
                passportChecked: data.passportChecked || false,
                passportExpiryOk: data.passportExpiryOk || false,
                passportRemarks: data.passportRemarks || '',
                arcChecked: data.arcChecked || false,
                arcHasIssues: data.arcHasIssues || false,
                arcRemarks: data.arcRemarks || '',
            });
        } catch (err) {
            console.error('Error fetching progress:', err);
            setError('載入資料失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overseas-progress/${candidateId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    medicalExamDate: formData.medicalExamDate || null,
                    policeClrDate: formData.policeClrDate || null,
                    medicalExamResult: formData.medicalExamResult || null,
                    policeClrStatus: formData.policeClrStatus || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || '儲存失敗');
            }

            router.push('/overseas-progress');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const generateReport = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overseas-progress/${candidateId}/report`, {
                credentials: 'include',
            });
            const report = await res.json();
            // 顯示報告或下載
            console.log('Report:', report);
            alert('進度報告已產生，請查看 Console');
        } catch (err) {
            console.error('Error generating report:', err);
        }
    };

    if (loading) {
        return (
            <StandardPageLayout title="載入中...">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="編輯海外進度"
            subtitle={candidate ? `${candidate.nameZh} (${candidate.passportNo})` : ''}
            breadcrumbs={[
                { label: '首頁', href: '/portal' },
                { label: '海外進度追蹤', href: '/overseas-progress' },
                { label: '編輯進度' },
            ]}
            actions={
                <button
                    type="button"
                    onClick={generateReport}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                    <FileText size={16} />
                    產生進度報告
                </button>
            }
        >
            <form onSubmit={handleSubmit} className="max-w-4xl">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                        <AlertTriangle size={18} />
                        {error}
                    </div>
                )}

                {/* 海外體檢 */}
                <div className="bg-white rounded-lg border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        海外體檢
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">體檢日期</label>
                            <input
                                type="date"
                                value={formData.medicalExamDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, medicalExamDate: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">體檢結果</label>
                            <select
                                value={formData.medicalExamResult}
                                onChange={(e) => setFormData(prev => ({ ...prev, medicalExamResult: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">請選擇</option>
                                <option value="PASS">合格</option>
                                <option value="FAIL">不合格</option>
                                <option value="PENDING">待審</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea
                                value={formData.medicalExamRemarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, medicalExamRemarks: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 良民證 */}
                <div className="bg-white rounded-lg border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        良民證
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">核發日期</label>
                            <input
                                type="date"
                                value={formData.policeClrDate}
                                onChange={(e) => setFormData(prev => ({ ...prev, policeClrDate: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">核發狀態</label>
                            <select
                                value={formData.policeClrStatus}
                                onChange={(e) => setFormData(prev => ({ ...prev, policeClrStatus: e.target.value }))}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">請選擇</option>
                                <option value="ISSUED">已核發</option>
                                <option value="PENDING">待審</option>
                                <option value="REJECTED">駁回</option>
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea
                                value={formData.policeClrRemarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, policeClrRemarks: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 護照檢查 */}
                <div className="bg-white rounded-lg border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        護照檢查
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="passportChecked"
                                checked={formData.passportChecked}
                                onChange={(e) => setFormData(prev => ({ ...prev, passportChecked: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="passportChecked" className="text-sm font-medium text-gray-700">
                                已檢查護照
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="passportExpiryOk"
                                checked={formData.passportExpiryOk}
                                onChange={(e) => setFormData(prev => ({ ...prev, passportExpiryOk: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="passportExpiryOk" className="text-sm font-medium text-gray-700">
                                護照效期大於6個月
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea
                                value={formData.passportRemarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, passportRemarks: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* 舊居留證檢查 */}
                <div className="bg-white rounded-lg border p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        舊居留證檢查
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="arcChecked"
                                checked={formData.arcChecked}
                                onChange={(e) => setFormData(prev => ({ ...prev, arcChecked: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="arcChecked" className="text-sm font-medium text-gray-700">
                                已檢查舊居留證
                            </label>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="arcHasIssues"
                                checked={formData.arcHasIssues}
                                onChange={(e) => setFormData(prev => ({ ...prev, arcHasIssues: e.target.checked }))}
                                className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <label htmlFor="arcHasIssues" className="text-sm font-medium text-gray-700">
                                有逾期或欠稅問題
                            </label>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                            <textarea
                                value={formData.arcRemarks}
                                onChange={(e) => setFormData(prev => ({ ...prev, arcRemarks: e.target.value }))}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/overseas-progress"
                        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} />
                        返回列表
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? '儲存中...' : '儲存'}
                    </button>
                </div>
            </form>
        </StandardPageLayout>
    );
}
