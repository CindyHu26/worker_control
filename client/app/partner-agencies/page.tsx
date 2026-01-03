'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StandardPageLayout, { TableWrapper } from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PartnerAgency {
    id: string;
    code: string;
    agencyNameZh: string;
    agencyNameEn: string;
    country: string;
    phone: string;
    isActive: boolean;
}

import { apiGet, apiDelete } from '@/lib/api';

// ...

export default function PartnerAgencyListPage() {
    const [data, setData] = useState<PartnerAgency[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const result = await apiGet<{ data: PartnerAgency[] }>('/api/partner-agencies');
            setData(result.data);
        } catch (error) {
            // Error toast handled globally
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        // if (!confirm(`確定要刪除 "${name}" 嗎?`)) return;

        try {
            await apiDelete(`/api/partner-agencies/${id}`);
            toast.success('已刪除');
            fetchData();
        } catch (error) {
            // Error toast handled globally
        }
    };

    return (
        <StandardPageLayout
            title="國外仲介管理 (Partner Agencies)"
            subtitle="管理合作的國外仲介公司資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '國外仲介管理', href: '/partner-agencies' }
            ]}
            actions={
                <Link href="/partner-agencies/new">
                    <Button className="gap-2">
                        <Plus size={16} /> 新增仲介
                    </Button>
                </Link>
            }
        >
            <TableWrapper>
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">代號</th>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">國別</th>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">公司名稱 (中文)</th>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">公司名稱 (英文)</th>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap">聯絡電話</th>
                            <th className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">載入中...</td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">尚無資料</td>
                            </tr>
                        ) : (
                            data.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-blue-600">{item.code}</td>
                                    <td className="px-4 py-3">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                                            {item.country || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">{item.agencyNameZh}</td>
                                    <td className="px-4 py-3 text-gray-500">{item.agencyNameEn || '-'}</td>
                                    <td className="px-4 py-3">{item.phone || '-'}</td>
                                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                        <Link href={`/partner-agencies/${item.id}`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pencil size={16} className="text-gray-500 hover:text-blue-600" />
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleDelete(item.id, item.agencyNameZh)}
                                        >
                                            <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </TableWrapper>
        </StandardPageLayout>
    );
}
