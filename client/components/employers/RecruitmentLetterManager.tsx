"use client";

import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { FileText, Plus, Trash2, Calendar } from 'lucide-react';

interface RecruitmentLetter {
    id: string;
    letterNumber: string;
    issueDate: string; // ISO
    expiryDate: string; // ISO
    approvedQuota: number;
    usedQuota: number;
}

interface RecruitmentLetterManagerProps {
    employerId: string;
}

export default function RecruitmentLetterManager({ employerId }: RecruitmentLetterManagerProps) {
    const [letters, setLetters] = useState<RecruitmentLetter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Letter Form State
    const [formData, setFormData] = useState({
        letterNumber: '',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        expiryDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
        approvedQuota: 0
    });

    const fetchLetters = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/employers/${employerId}`);
            if (res.ok) {
                const data = await res.json();
                // The API structure returns the employer with nested letters
                setLetters(data.recruitmentLetters || []);
            }
        } catch (error) {
            console.error('Failed to fetch letters', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLetters();
    }, [employerId]);

    const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newIssueDate = e.target.value;
        // Auto-calculate expiry (issue + 6 months)
        if (newIssueDate) {
            const expiry = format(addMonths(new Date(newIssueDate), 6), 'yyyy-MM-dd');
            setFormData(prev => ({
                ...prev,
                issueDate: newIssueDate,
                expiryDate: expiry
            }));
        } else {
            setFormData(prev => ({ ...prev, issueDate: newIssueDate }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:3001/api/employers/${employerId}/recruitment-letters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsAdding(false);
                setFormData({
                    letterNumber: '',
                    issueDate: format(new Date(), 'yyyy-MM-dd'),
                    expiryDate: format(addMonths(new Date(), 6), 'yyyy-MM-dd'),
                    approvedQuota: 0
                });
                fetchLetters();
            } else {
                alert('Failed to add letter');
            }
        } catch (error) {
            console.error(error);
            alert('Error adding letter');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此招募函嗎？')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/employers/${employerId}/recruitment-letters/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchLetters();
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="text-gray-500 text-sm">載入招募函資料中...</div>;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    招募函管理 (Recruitment Letters)
                </h3>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-1 text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Plus className="w-3 h-3" />
                    {isAdding ? '取消新增' : '新增函文'}
                </button>
            </div>

            <div className="p-6">
                {isAdding && (
                    <form onSubmit={handleSubmit} className="mb-6 bg-indigo-50 p-4 rounded-md border border-indigo-100 grid gap-4 grid-cols-1 md:grid-cols-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold text-indigo-900 mb-1">發文號 (Letter No.)</label>
                            <input
                                type="text"
                                className="w-full text-sm border-indigo-200 rounded focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                value={formData.letterNumber}
                                onChange={e => setFormData({ ...formData, letterNumber: e.target.value })}
                                required
                                placeholder="例如: 勞動發管字第..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-indigo-900 mb-1">發文日期 (Issue Date)</label>
                            <input
                                type="date"
                                className="w-full text-sm border-indigo-200 rounded focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                value={formData.issueDate}
                                onChange={handleIssueDateChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-indigo-900 mb-1">失效日期 (Expiry Date)</label>
                            <input
                                type="date"
                                className="w-full text-sm border-indigo-200 rounded focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                value={formData.expiryDate}
                                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-indigo-900 mb-1">核准名額 (Quota)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    className="w-full text-sm border-indigo-200 rounded focus:ring-indigo-500 focus:border-indigo-500 p-2"
                                    value={formData.approvedQuota}
                                    onChange={e => setFormData({ ...formData, approvedQuota: parseInt(e.target.value) })}
                                    required
                                />
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 whitespace-nowrap">
                                    儲存
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {letters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed border-gray-300">
                        尚無招募函資料。請點擊「新增函文」建立。
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {letters.map(letter => {
                            const available = letter.approvedQuota - letter.usedQuota;
                            const isExpired = new Date(letter.expiryDate) < new Date();

                            return (
                                <div key={letter.id} className={`relative p-4 rounded-lg border ${isExpired ? 'bg-gray-50 border-gray-200 opacity-75' : 'bg-white border-blue-100 shadow-sm hover:shadow-md transition-shadow'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-gray-800 text-sm truncate pr-6" title={letter.letterNumber}>
                                            {letter.letterNumber}
                                        </h4>
                                        <button
                                            onClick={() => handleDelete(letter.id)}
                                            className="text-gray-400 hover:text-red-500 transition-colors absolute top-4 right-3"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-500 mb-3 gap-2">
                                        <Calendar className="w-3 h-3" />
                                        <span>{format(new Date(letter.issueDate), 'yyyy-MM-dd')} ~ {format(new Date(letter.expiryDate), 'yyyy-MM-dd')}</span>
                                    </div>

                                    <div className="bg-gray-100 rounded-full h-2.5 mb-2 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${isExpired ? 'bg-gray-400' : 'bg-blue-500'}`}
                                            style={{ width: `${(letter.usedQuota / letter.approvedQuota) * 100}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">已用: {letter.usedQuota}</span>
                                        <span className={`font-bold ${isExpired ? 'text-gray-500' : 'text-blue-600'}`}>
                                            剩餘: {available}
                                        </span>
                                    </div>

                                    {isExpired && (
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12 border-2 border-red-500 text-red-500 font-bold px-2 text-lg rounded opacity-30 select-none">
                                            EXPIRED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
