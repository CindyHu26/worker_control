
"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, User } from 'lucide-react';

interface Worker {
    id: string;
    englishName: string;
    nationality: string;
    status?: string; // Adjust based on actual API response
    employerName?: string;
}

export default function WorkersPage() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchWorkers();
    }, []);

    const fetchWorkers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/workers');
            if (res.ok) {
                const data = await res.json();
                setWorkers(data);
            }
        } catch (error) {
            console.error('Failed to fetch workers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorkers = workers.filter(w =>
        w.englishName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.employerName && w.employerName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">移工管理 (Workers)</h1>
                    <p className="text-slate-500 mt-2">Manage worker profiles and documents.</p>
                </div>
                <Link
                    href="/workers/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <Plus size={20} />
                    <span>New Worker</span>
                </Link>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by name or employer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading workers...</div>
            ) : filteredWorkers.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
                    <User size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500">No workers found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Nationality</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWorkers.map((worker) => (
                                <tr key={worker.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{worker.englishName}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{worker.nationality}</td>
                                    <td className="px-6 py-4 text-slate-600">General</td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/workers/${worker.id}`}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                                        >
                                            View Details
                                        </Link>
                                    </td>
                                    or</tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
