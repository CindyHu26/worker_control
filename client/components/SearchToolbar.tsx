import React, { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterOption {
    label: string;
    value: string;
}

interface SearchToolbarProps {
    onSearch: (params: any) => void;
    placeholder?: string;
    statusOptions?: FilterOption[];
    nationalityOptions?: FilterOption[];
    showNationality?: boolean;
}

export default function SearchToolbar({
    onSearch,
    placeholder = "搜尋...",
    statusOptions = [],
    nationalityOptions = [],
    showNationality = false
}: SearchToolbarProps) {
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [nationality, setNationality] = useState('');

    // Debounce search term to avoid hitting API on every keystroke
    const [debouncedQ, setDebouncedQ] = useState(q);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQ(q);
        }, 500);
        return () => clearTimeout(handler);
    }, [q]);

    // Trigger search when debouncedQ or filters change
    useEffect(() => {
        onSearch({ q: debouncedQ, status, nationality });
    }, [debouncedQ, status, nationality]);

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {q && (
                    <button
                        onClick={() => setQ('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Filters Group */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mr-1">
                    <Filter size={16} />
                    <span>篩選:</span>
                </div>

                {/* Status Dropdown */}
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 min-w-[140px]"
                >
                    <option value="">全部狀態</option>
                    {statusOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>

                {/* Nationality Dropdown (Conditional) */}
                {showNationality && (
                    <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 min-w-[140px]"
                    >
                        <option value="">全部國籍</option>
                        {nationalityOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
}
