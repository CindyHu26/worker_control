'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';

interface CollectionPlan {
    id: string;
    code: string;
    nationalityCode: string;
    category: string;
    salaryCalcMethod: string;
    payDay: number;
    isActive: boolean;
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

const categoryLabels: Record<string, string> = {
    household: '家庭類',
    corporate: '公司類',
};

const salaryCalcMethodLabels: Record<string, string> = {
    entry_date: '入境日',
    handover_date: '交工日',
    handover_next: '交工日之次日',
    monthly: '月份式',
    entry_plus_one: '入境日+1天',
};

export default function CollectionPlansPage() {
    const [plans, setPlans] = useState<CollectionPlan[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchPlans = async (page: number = 1, search: string = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
            });
            if (search) params.append('search', search);

            const response = await fetch(`/api/collection-plans?${params}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setPlans(data.data);
            setPagination(data.pagination);
        } catch (error) {
            console.error('Error fetching collection plans:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans(currentPage, searchTerm);
    }, [currentPage, searchTerm]);

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此收款計劃嗎？')) return;

        try {
            const response = await fetch(`/api/collection-plans/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Delete failed');
            fetchPlans(currentPage, searchTerm);
        } catch (error) {
            console.error('Error deleting collection plan:', error);
            alert('刪除失敗');
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchPlans(1, searchTerm);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="md:pl-64 lg:pl-72">
                <div className="p-4 md:p-6 lg:p-8 pr-4 md:pr-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">收款計劃設定</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                管理各國籍與類別的收款計劃設定
                            </p>
                        </div>
                        <Link
                            href="/collection-plans/new"
                            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            新增收款計劃
                        </Link>
                    </div>

                    {/* Search */}
                    <div className="mb-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="搜尋代號或國籍..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                                搜尋
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="w-full overflow-x-auto rounded-md border bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        代號
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        國籍
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        類別
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        計薪方式
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        發薪日
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        狀態
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        操作
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            載入中...
                                        </td>
                                    </tr>
                                ) : plans.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                            尚無資料
                                        </td>
                                    </tr>
                                ) : (
                                    plans.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {plan.code}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {plan.nationalityCode}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {categoryLabels[plan.category] || plan.category}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {salaryCalcMethodLabels[plan.salaryCalcMethod] || plan.salaryCalcMethod}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                每月 {plan.payDay} 日
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${plan.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {plan.isActive ? '啟用' : '停用'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Link
                                                        href={`/collection-plans/${plan.id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-1"
                                                        title="編輯"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(plan.id)}
                                                        className="text-red-600 hover:text-red-900 p-1"
                                                        title="刪除"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                共 {pagination.total} 筆，第 {pagination.page} / {pagination.totalPages} 頁
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    上一頁
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={currentPage === pagination.totalPages}
                                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    下一頁
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
