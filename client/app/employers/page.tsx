"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import SearchToolbar from '@/components/SearchToolbar';
import { apiGet } from '@/lib/api';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
    responsiblePerson: string;
    phoneNumber?: string;
    category?: string;
    // Basic fields
    code?: string;
    homeCareInfo?: {
        patients: Array<{
            name: string;
            careAddress: string;
        }>;
    };
    institutionInfo?: {
        institutionCode: string;
        bedCount: number;
    };
    _count?: {
        deployments: number;
    };
}

export default function EmployersPage() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [searchParams, setSearchParams] = useState({ q: '' });
    const [activeCategory, setActiveCategory] = useState('ALL');

    const fetchEmployers = async (page = 1) => {
        setLoading(true);
        try {
            const params: any = {
                page: page.toString(),
                limit: '10',
                q: searchParams.q
            };
            if (activeCategory !== 'ALL') {
                params.category = activeCategory;
            }
            const query = new URLSearchParams(params);

            // Use apiGet wrapper to handle Authentication (Cookie Token)
            const result = await apiGet<{ data: Employer[], meta: any }>(`/api/employers?${query}`);

            setEmployers(result.data);
            setMeta(result.meta);
        } catch (error) {
            console.error('Failed to fetch employers:', error);
            // Optional: Handle 401 specifically if needed, but wrapper throws error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployers(1);
    }, [searchParams, activeCategory]);

    const handleSearch = (params: any) => {
        setSearchParams(params);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchEmployers(newPage);
        }
    };

    const renderTableHeaders = () => {
        switch (activeCategory) {
            case 'HOME_CARE':
                return (
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">雇主編號 (Code)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">雇主名稱 (Employer)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">被看護人 (Patient)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">看護地址 (Address)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">在職工人 (Active)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">操作 (Actions)</th>
                    </tr>
                );
            case 'INSTITUTION':
                return (
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">機構代碼 (Code)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">機構名稱 (Institution)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">床位數 (Beds)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">在職工人 (Active)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">操作 (Actions)</th>
                    </tr>
                );
            default: // MANUFACTURING & ALL
                return (
                    <tr>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">雇主編號 (Code)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">公司名稱 (Company)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">統一編號 (Tax ID)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">負責人 (Rep)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">在職工人 (Active)</th>
                        <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">操作 (Actions)</th>
                    </tr>
                );
        }
    };

    const renderRow = (emp: Employer) => {
        const commonActions = (
            <td className="px-6 py-4">
                <Link
                    href={`/employers/${emp.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                    查看詳情 (Details)
                </Link>
            </td>
        );

        // Common Code Column
        const codeCell = <td className="px-6 py-4 text-slate-600 font-mono text-sm">{emp.code || '-'}</td>;

        if (activeCategory === 'HOME_CARE') {
            const patient = emp.homeCareInfo?.patients?.[0];
            return (
                <tr key={emp.id} className="hover:bg-slate-50 transition duration-150">
                    {codeCell}
                    <td className="px-6 py-4 font-bold text-slate-900">{emp.companyName || emp.responsiblePerson}</td>
                    <td className="px-6 py-4 text-slate-600">{patient?.name || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 truncate max-w-xs">{patient?.careAddress || '-'}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${(emp._count?.deployments || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                            {emp._count?.deployments || 0}
                        </span>
                    </td>
                    {commonActions}
                </tr>
            );
        } else if (activeCategory === 'INSTITUTION') {
            return (
                <tr key={emp.id} className="hover:bg-slate-50 transition duration-150">
                    <td className="px-6 py-4 text-slate-600 font-mono text-sm">{emp.institutionInfo?.institutionCode || emp.code || '-'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{emp.companyName}</td>
                    <td className="px-6 py-4 text-slate-600">{emp.institutionInfo?.bedCount || '-'}</td>
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${(emp._count?.deployments || 0) > 0 ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                            {emp._count?.deployments || 0}
                        </span>
                    </td>
                    {commonActions}
                </tr>
            );
        }

        // Manufacturing / Default
        return (
            <tr key={emp.id} className="hover:bg-slate-50 transition duration-150">
                {codeCell}
                <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{emp.companyName}</div>
                    {emp.phoneNumber && (
                        <div className="text-xs text-slate-500 mt-1">{emp.phoneNumber}</div>
                    )}
                </td>
                <td className="px-6 py-4 text-slate-600 font-mono text-sm">{emp.taxId}</td>
                <td className="px-6 py-4 text-slate-600">{emp.responsiblePerson || '-'}</td>
                <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${(emp._count?.deployments || 0) > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                        {emp._count?.deployments || 0}
                    </span>
                </td>
                {commonActions}
            </tr>
        );
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">雇主資料管理 (Employers)</h1>
                    <p className="text-slate-500 mt-2">管理雇主檔案與需求 (Manage profiles and requirements)</p>
                </div>
                <Link
                    href="/employers/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>新增雇主</span>
                </Link>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-6 border-b border-slate-200">
                {['ALL', 'MANUFACTURING', 'HOME_CARE', 'INSTITUTION'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeCategory === cat
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        {cat === 'ALL' ? '全部 (All)' :
                            cat === 'MANUFACTURING' ? '製造業 (Manufacturing)' :
                                cat === 'HOME_CARE' ? '家庭看護 (Home Care)' : '養護機構 (Institution)'}
                    </button>
                ))}
            </div>

            <SearchToolbar
                onSearch={handleSearch}
                placeholder="搜尋公司名稱、統編、負責人..."
            />

            {!loading && (
                <p className="text-sm text-slate-500 mb-4 ml-1">
                    共找到 {meta.total} 筆資料
                </p>
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : employers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">找不到符合條件的雇主</h3>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            {renderTableHeaders()}
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employers.map(renderRow)}
                        </tbody>
                    </table>

                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <button
                            onClick={() => handlePageChange(meta.page - 1)}
                            disabled={meta.page === 1}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition
                                ${meta.page === 1
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-300'
                                }
                            `}
                        >
                            <ChevronLeft size={16} />
                            上一頁 (Prev)
                        </button>

                        <span className="text-sm text-slate-600 font-medium">
                            第 {meta.page} 頁，共 {meta.totalPages} 頁
                        </span>

                        <button
                            onClick={() => handlePageChange(meta.page + 1)}
                            disabled={meta.page === meta.totalPages}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition
                                ${meta.page === meta.totalPages
                                    ? 'text-slate-400 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-300'
                                }
                            `}
                        >
                            下一頁 (Next)
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
