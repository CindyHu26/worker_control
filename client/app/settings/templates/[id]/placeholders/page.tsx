"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, Link2, AlertCircle, CheckCircle } from 'lucide-react';

interface PlaceholderInfo {
    key: string;
    location?: string;
    systemField?: string;
    description?: string;
}

interface AvailableField {
    key: string;
    description: string;
    category: string;
}

export default function PlaceholderEditorPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params.id as string;

    const [template, setTemplate] = useState<any>(null);
    const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);
    const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [templateId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch template details
            const templateRes = await fetch(`http://localhost:3001/api/documents/templates/${templateId}`);
            if (templateRes.ok) {
                const data = await templateRes.json();
                setTemplate(data);
            }

            // Fetch placeholders
            const placeholderRes = await fetch(`http://localhost:3001/api/documents/templates/${templateId}/placeholders`);
            if (placeholderRes.ok) {
                const data = await placeholderRes.json();
                setPlaceholders(Array.isArray(data) ? data : []);
            }

            // Fetch available fields
            const fieldsRes = await fetch('http://localhost:3001/api/documents/available-fields');
            if (fieldsRes.ok) {
                const data = await fieldsRes.json();
                setAvailableFields(data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFieldMapping = (placeholderKey: string, systemField: string) => {
        setPlaceholders(prev => prev.map(p =>
            p.key === placeholderKey ? { ...p, systemField } : p
        ));
        setSaveMessage(null);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage(null);
        try {
            const res = await fetch(`http://localhost:3001/api/documents/templates/${templateId}/placeholders`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ placeholderSchema: placeholders })
            });

            if (res.ok) {
                setSaveMessage({ type: 'success', text: '儲存成功！' });
            } else {
                const err = await res.json();
                setSaveMessage({ type: 'error', text: err.error || '儲存失敗' });
            }
        } catch (error: any) {
            setSaveMessage({ type: 'error', text: error.message || '系統錯誤' });
        } finally {
            setIsSaving(false);
        }
    };

    // Group available fields by category
    const groupedFields = availableFields.reduce((acc, field) => {
        if (!acc[field.category]) acc[field.category] = [];
        acc[field.category].push(field);
        return acc;
    }, {} as Record<string, AvailableField[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">
                        欄位對應設定
                    </h1>
                    <p className="text-slate-500 mt-1">
                        範本: <span className="font-medium text-slate-700">{template?.name}</span>
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    儲存設定
                </button>
            </div>

            {/* Save Message */}
            {saveMessage && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {saveMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {saveMessage.text}
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Detected Placeholders */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Link2 size={18} className="text-blue-600" />
                            偵測到的欄位 ({placeholders.length})
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            這些是從範本中解析出的 Placeholder 變數
                        </p>
                    </div>

                    {placeholders.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p>找不到 Placeholder 變數</p>
                            <p className="text-xs mt-1">請確認範本中使用 {'{變數名稱}'} 格式</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {placeholders.map((placeholder, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 transition">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-mono text-sm font-bold text-slate-800">
                                                {'{' + placeholder.key + '}'}
                                            </div>
                                            {placeholder.location && (
                                                <div className="text-xs text-slate-400 mt-1">
                                                    位置: {placeholder.location}
                                                </div>
                                            )}
                                        </div>
                                        <select
                                            value={placeholder.systemField || ''}
                                            onChange={(e) => handleFieldMapping(placeholder.key, e.target.value)}
                                            className={`w-48 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none ${placeholder.systemField
                                                    ? 'border-green-300 bg-green-50'
                                                    : 'border-slate-200 bg-white'
                                                }`}
                                        >
                                            <option value="">-- 選擇對應欄位 --</option>
                                            {Object.entries(groupedFields).map(([category, fields]) => (
                                                <optgroup key={category} label={category}>
                                                    {fields.map(field => (
                                                        <option key={field.key} value={field.key}>
                                                            {field.description}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available Fields Reference */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h2 className="font-bold text-slate-800">
                            系統可用欄位
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            可在範本中使用的資料欄位清單
                        </p>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto">
                        {Object.entries(groupedFields).map(([category, fields]) => (
                            <div key={category}>
                                <div className="px-4 py-2 bg-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wide sticky top-0">
                                    {category}
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {fields.map(field => (
                                        <div key={field.key} className="px-4 py-2 hover:bg-slate-50">
                                            <div className="font-mono text-xs text-blue-600">
                                                {'{' + field.key + '}'}
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {field.description}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
