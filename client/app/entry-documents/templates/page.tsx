"use client";

import React, { useState, useEffect } from 'react';
import { Plus, FileText, TestTube, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import PageContainer from '@/components/layout/PageContainer';

interface Template {
    id: string;
    name: string;
    category: string;
    fileFormat: string;
    isActive: boolean;
    isTested: boolean;
    createdAt: string;
}

export default function TemplatesListPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/templates?category=entry_notification');
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此範本嗎？')) return;

        try {
            const response = await fetch(`/api/templates/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchTemplates();
            } else {
                alert('刪除失敗');
            }
        } catch (error) {
            console.error(error);
            alert('刪除時發生錯誤');
        }
    };

    const getStatusBadge = (template: Template) => {
        if (template.isActive && template.isTested) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                    <CheckCircle size={12} />
                    已啟用
                </span>
            );
        } else if (template.isTested) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                    <TestTube size={12} />
                    已測試未啟用
                </span>
            );
        } else {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                    <XCircle size={12} />
                    未測試
                </span>
            );
        }
    };

    return (
        <PageContainer
            title="入境文件範本管理"
            subtitle="管理入國通報與證照申辦文件範本"
        >
            <div className="mb-6 flex justify-between items-center">
                <div className="flex gap-3">
                    <Link
                        href="/entry-documents"
                        className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                    >
                        ← 返回文件產生
                    </Link>
                </div>
                <Link
                    href="/settings/templates"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Plus size={18} />
                    上傳新範本
                </Link>
            </div>

            <div className="w-full overflow-x-auto rounded-md border bg-white">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                範本名稱
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                檔案格式
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                狀態
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                建立時間
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    載入中...
                                </td>
                            </tr>
                        ) : templates.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    尚無範本，請先上傳範本檔案
                                </td>
                            </tr>
                        ) : (
                            templates.map((template) => (
                                <tr key={template.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <FileText size={18} className="text-gray-400" />
                                            <span className="font-medium text-gray-900">
                                                {template.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-600 uppercase">
                                            {template.fileFormat || 'docx'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {getStatusBadge(template)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(template.createdAt).toLocaleDateString('zh-TW')}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                刪除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </PageContainer>
    );
}
