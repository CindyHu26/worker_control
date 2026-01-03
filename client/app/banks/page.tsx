"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiGet } from '@/lib/api';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { TableWrapper } from '@/components/ui/table-wrapper';
import { BankResponse, PaginationMeta } from '@worker-control/shared';
import SearchToolbar from '@/components/SearchToolbar'; // Reusing existing if possible, or build simple input

export default function BanksPage() {
    const [banks, setBanks] = useState<BankResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchBanks = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                ...(searchQuery ? { q: searchQuery } : {})
            });

            const result = await apiGet<{ data: BankResponse[], meta: PaginationMeta }>(`/api/banks?${params}`);

            setBanks(result.data);
            setMeta(result.meta);
        } catch (error) {
            console.error('Failed to fetch banks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanks(1);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchBanks(newPage);
        }
    };

    const handleSearch = (params: { q: string }) => {
        setSearchQuery(params.q);
    };

    return (
        <StandardPageLayout
            title="銀行管理 (Bank Management)"
            subtitle="維護銀行代碼與帳戶關聯資訊 (Manage bank codes and references)"
            actions={
                <Link href="/banks/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        新增銀行 (Add Bank)
                    </Button>
                </Link>
            }
            maxWidth="full"
            card={false} // We handle card style inside or just use container
        >
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6 mb-6">
                <SearchToolbar
                    onSearch={handleSearch}
                    placeholder="搜尋銀行名稱、代號..."
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : banks.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">找不到符合條件的銀行</h3>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <TableWrapper>
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">代號 (Code)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">銀行名稱 (Name)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">聯絡人 (Contact)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">電話 (Phone)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap">狀態 (Status)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm whitespace-nowrap text-right">操作 (Actions)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {banks.map((bank) => (
                                    <tr key={bank.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-900 font-mono text-sm">{bank.code}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{bank.bankName}</div>
                                            {bank.bankNameEn && <div className="text-xs text-slate-500">{bank.bankNameEn}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{bank.contactPerson || '-'}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono">{bank.phone || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${bank.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                                                {bank.isActive ? '啟用 (Active)' : '停用 (Inactive)'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/banks/${bank.id}`}>
                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    編輯
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </TableWrapper>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page === 1}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> 上一頁
                        </Button>
                        <span className="text-sm text-slate-600">
                            第 {meta.page} 頁，共 {meta.totalPages} 頁 (Total: {meta.total})
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page === meta.totalPages}
                        >
                            下一頁 <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </StandardPageLayout>
    );
}
