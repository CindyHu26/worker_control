"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    FileText, Upload, Trash2, Download, Settings2,
    Plus, Search, FolderOpen, AlertCircle, CheckCircle, Loader2, FileSpreadsheet, BookOpen
} from 'lucide-react';

const CATEGORIES = [
    { id: 'entry_notification', label: '入國通報 (Entry Notification)' },
    { id: 'entry_packet', label: '新入境套組 (Entry Packet)' },
    { id: 'handover_packet', label: '交工本 (Handover)' },
    { id: 'medical_check', label: '定期體檢 (Medical)' },
    { id: 'transfer_exit', label: '轉出/離境 (Transfer)' },
    { id: 'permit_app', label: '函文申請 (Permit)' },
    { id: 'general', label: '其他範本 (General)' }
];

export default function TemplateSettingsPage() {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0].id);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        category: CATEGORIES[0].id,
        scope: 'universal' as 'universal' | 'employer_specific',
        employerId: null as string | null,
        file: null as File | null
    });
    const [employers, setEmployers] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch employers for selector
    const fetchEmployers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/recruitment/employers/list');
            if (res.ok) {
                const data = await res.json();
                setEmployers(data);
            }
        } catch (error) {
            console.error('Failed to fetch employers:', error);
        }
    };

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/documents/templates?category=${selectedCategory}`);
            if (res.ok) {
                const data = await res.json();
                setTemplates(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
        setUploadForm(prev => ({ ...prev, category: selectedCategory }));
    }, [selectedCategory]);

    useEffect(() => {
        fetchEmployers();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setUploadForm(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handleUpload = async () => {
        if (!uploadForm.file || !uploadForm.name) return;
        if (uploadForm.scope === 'employer_specific' && !uploadForm.employerId) {
            alert('請選擇雇主');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', uploadForm.file);
        formData.append('name', uploadForm.name);
        formData.append('description', uploadForm.description);
        formData.append('category', uploadForm.category);
        if (uploadForm.scope === 'employer_specific' && uploadForm.employerId) {
            formData.append('employerId', uploadForm.employerId);
        }

        try {
            const res = await fetch('http://localhost:3001/api/documents/templates', {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                setIsUploadModalOpen(false);
                setUploadForm({
                    name: '',
                    description: '',
                    category: selectedCategory,
                    scope: 'universal',
                    employerId: null,
                    file: null
                });
                fetchTemplates(); // Refresh
                alert('上傳成功 (Upload Successful)');
            } else {
                const err = await res.json();
                alert('Upload Failed: ' + (err.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('System Error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            // Assuming DELETE endpoint exists, if not, UI handles removal only visually?
            // Checking backend routes... usually DELETE /:id
            // If backend is missing DELETE, we might fail. Just trying for now.
            const res = await fetch(`http://localhost:3001/api/documents/templates/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchTemplates();
            } else {
                alert('Delete Failed (Backend support pending?)');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">文件範本管理 (Templates)</h1>
                    <p className="text-slate-500 mt-2">管理系統自動生成文件所使用的 Word (.docx) 與 Excel (.xlsx) 範本</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/settings/templates/placeholders"
                        className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition shadow-sm hover:shadow"
                    >
                        <BookOpen size={20} />
                        <span>變數對照表</span>
                    </Link>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                    >
                        <Upload size={20} />
                        <span>上傳新範本</span>
                    </button>
                </div>
            </div>

            <div className="flex gap-8 flex-1 overflow-hidden">
                {/* Categorized Sidebar */}
                <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition ${selectedCategory === cat.id
                                ? 'bg-blue-50 text-blue-700 font-bold border border-blue-100'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                                }`}
                        >
                            <FolderOpen size={18} className={selectedCategory === cat.id ? 'text-blue-500' : 'text-slate-400'} />
                            <span className="truncate">{cat.label}</span>
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <FileText size={18} className="text-slate-400" />
                            {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full ml-2">
                                {templates.length}
                            </span>
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full text-slate-400">
                                <Loader2 className="animate-spin mr-2" /> Loading...
                            </div>
                        ) : templates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <FileText size={48} className="opacity-20 mb-4" />
                                <p>此類別尚無範本 (No templates)</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">範本名稱 (Name)</th>
                                        <th className="p-4 w-24">格式</th>
                                        <th className="p-4">描述 (Description)</th>
                                        <th className="p-4 w-32 text-center">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {templates.map(tmpl => (
                                        <tr key={tmpl.id} className="hover:bg-slate-50 transition group">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    {tmpl.fileFormat === 'xlsx' ? (
                                                        <FileSpreadsheet size={18} className="text-green-600" />
                                                    ) : (
                                                        <FileText size={18} className="text-blue-600" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-800">{tmpl.name}</span>
                                                            {tmpl.employerId && (
                                                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-bold">
                                                                    專用
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                            {tmpl.originalName || tmpl.filename}
                                                            {tmpl.employer && (
                                                                <span className="ml-2 text-purple-600">
                                                                    • {tmpl.employer.companyName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${tmpl.fileFormat === 'xlsx' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {tmpl.fileFormat || 'docx'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600">
                                                {tmpl.description || '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => window.open(`/settings/templates/${tmpl.id}/placeholders`, '_blank')}
                                                        className="p-2 text-slate-400 hover:text-blue-600 transition rounded hover:bg-blue-50"
                                                        title="編輯欄位對應"
                                                    >
                                                        <Settings2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(tmpl.id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 transition rounded hover:bg-red-50"
                                                        title="刪除"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">上傳新範本 (Upload Template)</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">檔案 (Word .docx 或 Excel .xlsx)</label>
                                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer bg-slate-50 relative">
                                    <input
                                        type="file"
                                        accept=".docx,.xlsx"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    {uploadForm.file ? (
                                        <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
                                            <CheckCircle size={20} />
                                            {uploadForm.file.name}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">
                                            <Upload className="mx-auto mb-2 text-slate-400" />
                                            Drag & drop or Click to browse
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">範本名稱 (Name)</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={uploadForm.name}
                                    onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    placeholder="e.g. 勞動契約書 v2024"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">類別 (Category)</label>
                                <select
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={uploadForm.category}
                                    onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c.id} value={c.id}>{c.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">範本適用範圍 (Scope)</label>
                                <select
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                    value={uploadForm.scope}
                                    onChange={e => setUploadForm({ ...uploadForm, scope: e.target.value as 'universal' | 'employer_specific', employerId: null })}
                                >
                                    <option value="universal">通用範本 (Universal)</option>
                                    <option value="employer_specific">指定雇主專用 (Employer-Specific)</option>
                                </select>
                            </div>

                            {uploadForm.scope === 'employer_specific' && (
                                <div className="animate-in slide-in-from-top-2 duration-200">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        選擇雇主 (Employer) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={uploadForm.employerId || ''}
                                        onChange={e => setUploadForm({ ...uploadForm, employerId: e.target.value || null })}
                                    >
                                        <option value="">-- 請選擇雇主 --</option>
                                        {employers.map(emp => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.companyName} ({emp.taxId || 'N/A'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">描述 (Description)</label>
                                <textarea
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                                    value={uploadForm.description}
                                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    placeholder="Optional description..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={isUploading || !uploadForm.file || !uploadForm.name}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploading && <Loader2 className="animate-spin" size={16} />}
                                上傳 (Upload)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
