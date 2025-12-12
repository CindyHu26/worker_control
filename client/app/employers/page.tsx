"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Building2, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import SearchToolbar from '@/components/SearchToolbar';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
    responsiblePerson: string;
    phoneNumber?: string;
    _count?: {
        deployments: number;
    };
}

export default function EmployersPage() {
    const [employers, setEmployers] = useState<Employer[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
    const [searchParams, setSearchParams] = useState({ q: '' });

    const fetchEmployers = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                q: searchParams.q
            });

            const res = await fetch(`http://localhost:3001/api/employers?${query}`);
            if (res.ok) {
                const { data, meta } = await res.json();
                setEmployers(data);
                setMeta(meta);
            }
        } catch (error) {
            console.error('Failed to fetch employers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployers(1);
    }, [searchParams]);

    const handleSearch = (params: any) => {
        setSearchParams(params);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchEmployers(newPage);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">雇主資料 (Employers)</h1>
                    <p className="text-slate-500 mt-2">Manage employer profiles and requirements.</p>
                </div>
                <Link
                    href="/employers/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>New Employer</span>
                </Link>
            </div>

            <SearchToolbar
                onSearch={handleSearch}
                placeholder="Search company, tax ID, representative..."
            />

            {!loading && (
                <p className="text-sm text-slate-500 mb-4 ml-1">
                    Found {meta.total} records
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
                    <h3 className="text-lg font-medium text-slate-900">No employers found</h3>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Company Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Tax ID</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Representative</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Active Workers</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employers.map((emp) => (
                                <tr key={emp.id} className="hover:bg-slate-50 transition duration-150">
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
                                            {emp._count?.deployments || 0} Workers
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/employers/${emp.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                </tr>
                            ))}
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
                            Previous
                        </button>

                        <span className="text-sm text-slate-600 font-medium">
                            Page {meta.page} of {meta.totalPages}
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
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
