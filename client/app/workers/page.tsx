
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, User, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchToolbar from '@/components/SearchToolbar';

interface Worker {
    id: string;
    englishName: string;
    chineseName?: string;
    nationality: string;
    deployments: { status: string; employer: { companyName: string } }[];
    passports: { passportNumber: string }[];
}

export default function WorkersPage() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [meta, setMeta] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });

    // Search Params State
    const [searchParams, setSearchParams] = useState({ q: '', status: '', nationality: '' });

    const fetchWorkers = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                q: searchParams.q,
                status: searchParams.status,
                nationality: searchParams.nationality
            });

            const res = await fetch(`http://localhost:3001/api/workers?${query}`);
            if (res.ok) {
                const { data, meta } = await res.json();
                setWorkers(data);
                setMeta(meta);
            }
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when search params change (reset to page 1)
    useEffect(() => {
        fetchWorkers(1);
    }, [searchParams]);

    const handleSearch = (params: any) => {
        setSearchParams(params);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.totalPages) {
            fetchWorkers(newPage);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">移工管理 (Workers)</h1>
                    <p className="text-slate-500 mt-2">Manage worker profiles and documents.</p>
                </div>
                <Link
                    href="/workers/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>New Worker</span>
                </Link>
            </div>

            {/* Search Toolbar */}
            <SearchToolbar
                onSearch={handleSearch}
                placeholder="Search name, passport, arc..."
                showNationality={true}
                nationalityOptions={[
                    { label: 'Indonesia', value: 'Indonesia' },
                    { label: 'Vietnam', value: 'Vietnam' },
                    { label: 'Philippines', value: 'Philippines' },
                    { label: 'Thailand', value: 'Thailand' }
                ]}
                statusOptions={[
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' }
                ]}
            />

            {/* Results Info */}
            {!loading && (
                <p className="text-sm text-slate-500 mb-4 ml-1">
                    Found {meta.total} records
                </p>
            )}

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : workers.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">No workers found</h3>
                    <p className="text-slate-500 mt-1">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Worker</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Nationality</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Current Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Employer</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workers.map((worker) => {
                                const activeDeployment = worker.deployments[0]; // We filtered for active
                                const hasActiveDeployment = !!activeDeployment;

                                return (
                                    <tr key={worker.id} className="hover:bg-slate-50 transition duration-150">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-slate-900">{worker.englishName}</div>
                                                <div className="text-sm text-slate-500">{worker.chineseName || '-'}</div>
                                                {worker.passports?.[0] && (
                                                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                        <FileText size={10} />
                                                        {worker.passports[0].passportNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <span className="px-2 py-1 bg-slate-100 rounded text-sm font-medium">
                                                {worker.nationality}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {hasActiveDeployment ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {activeDeployment?.employer?.companyName || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/workers/${worker.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
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
