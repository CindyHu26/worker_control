"use client";

import React, { useState, useEffect } from 'react';
import { BookOpen, Copy, Search, CheckCircle2, X, Lightbulb, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface PlaceholderField {
    code: string;
    label: string;
    example?: string;
    note?: string;
}

interface PlaceholderCategory {
    category: string;
    fields: PlaceholderField[];
}

export default function PlaceholderReferencePage() {
    const [dictionary, setDictionary] = useState<PlaceholderCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [isTipsExpanded, setIsTipsExpanded] = useState(false);

    useEffect(() => {
        fetchDictionary();
    }, []);

    const fetchDictionary = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:3001/api/templates/dictionary', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                window.location.href = '/login';
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setDictionary(data);
                if (data.length > 0) {
                    setSelectedCategory(data[0].category);
                }
            }
        } catch (error) {
            console.error('Failed to fetch dictionary:', error);
            toast.error('無法載入變數對照表');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToClipboard = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success('已複製到剪貼簿', {
                description: code
            });
            setTimeout(() => setCopiedCode(null), 2000);
        } catch (error) {
            toast.error('複製失敗');
        }
    };

    const currentCategory = dictionary.find(cat => cat.category === selectedCategory);

    const filteredFields = currentCategory?.fields.filter(field =>
        field.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        field.example?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="p-4 w-full h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 shrink-0">
                <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="text-blue-600" size={32} />
                    <h1 className="text-3xl font-bold text-slate-900">文件變數對照表</h1>
                </div>
                <p className="text-slate-500">
                    查詢可用的範本變數並複製到您的 Word 或 Excel 範本中
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="搜尋變數名稱或說明..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex gap-6 flex-1 overflow-hidden">
                {/* Category Tabs (Sidebar) */}
                <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        dictionary.map((cat) => (
                            <button
                                key={cat.category}
                                onClick={() => setSelectedCategory(cat.category)}
                                className={`text-left px-4 py-3 rounded-lg flex items-center justify-between transition ${selectedCategory === cat.category
                                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                    }`}
                            >
                                <span className="truncate">{cat.category}</span>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${selectedCategory === cat.category
                                    ? 'bg-blue-200 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                    }`}>
                                    {cat.fields.length}
                                </span>
                            </button>
                        ))
                    )}
                </div>

                {/* Fields Table */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            {currentCategory?.category}
                            {searchQuery && (
                                <span className="text-sm font-normal text-slate-500">
                                    ({filteredFields.length} 個結果)
                                </span>
                            )}
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                            </div>
                        ) : filteredFields.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Search size={48} className="opacity-20 mb-4" />
                                <p>找不到符合的變數</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-3 w-1/3 text-slate-700">欄位名稱</th>
                                        <th className="p-3 w-1/3 text-slate-700">變數代碼</th>
                                        <th className="p-3 w-1/3 text-slate-700">說明/範例</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredFields.map((field, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition border-b border-slate-50">
                                            <td className="p-2 pl-4 align-middle">
                                                <span className="font-medium text-slate-800">{field.label}</span>
                                            </td>
                                            <td className="p-2 align-middle">
                                                <button
                                                    onClick={() => handleCopyToClipboard(field.code)}
                                                    className="group flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 rounded-lg transition font-mono text-sm text-slate-700 hover:text-blue-700 border border-transparent hover:border-blue-200"
                                                    title="點擊複製"
                                                >
                                                    <span className="font-bold">{field.code}</span>
                                                    {copiedCode === field.code ? (
                                                        <CheckCircle2 size={16} className="text-green-600" />
                                                    ) : (
                                                        <Copy size={16} className="opacity-0 group-hover:opacity-100 transition" />
                                                    )}
                                                </button>
                                            </td>
                                            <td className="p-2 align-middle">
                                                {field.note ? (
                                                    <span className="text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                        {field.note}
                                                    </span>
                                                ) : field.example ? (
                                                    <span className="text-sm text-slate-600 font-mono">
                                                        {field.example}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Tips */}
            {/* Quick Tips - Collapsible */}
            <div className="shrink-0 mt-4 bg-blue-50 border border-blue-100 rounded-lg overflow-hidden transition-all">
                <button
                    onClick={() => setIsTipsExpanded(!isTipsExpanded)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-blue-100/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1 rounded">
                            <Lightbulb size={16} className="text-blue-600" />
                        </div>
                        <span className="font-bold text-blue-900 text-sm">使用提示 (Usage Tips)</span>
                    </div>
                    <ChevronDown size={16} className={`text-blue-500 transition-transform ${isTipsExpanded ? 'rotate-180' : ''}`} />
                </button>

                {isTipsExpanded && (
                    <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                        <ul className="text-sm text-blue-800 space-y-1 ml-9">
                            <li>• 點擊變數代碼即可複製到剪貼簿</li>
                            <li>• 在 Word 範本中直接貼上變數代碼，系統會自動替換為實際資料</li>
                            <li>• 勾選框 (Checkbox) 變數會根據條件顯示 ☑ 或 ☐</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
