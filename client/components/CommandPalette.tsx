"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, User, Building2, Receipt, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    type: 'worker' | 'employer' | 'bill';
    title: string;
    subtitle: string;
    url: string;
}

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Toggle with Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Search Logic (Debounced)
    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:3001/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                    setActiveIndex(0);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Navigation Keys
    const handleNavigation = (e: React.KeyboardEvent) => {
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(results[activeIndex]);
        }
    };

    const handleSelect = (result: SearchResult) => {
        setIsOpen(false);
        router.push(result.url);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center pt-[15vh]">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                    <Search className="text-slate-400" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search workers, employers... (Passport, Name, etc.)"
                        className="flex-1 text-lg outline-none placeholder:text-slate-400 text-slate-900"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleNavigation}
                    />
                    {loading && <Loader2 className="animate-spin text-blue-500" size={18} />}
                    <div className="hidden sm:flex gap-1">
                        <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-500 font-mono">ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((result, index) => (
                                <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSelect(result)}
                                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${index === activeIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                                        }`}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${result.type === 'worker' ? 'bg-emerald-100 text-emerald-600' :
                                            result.type === 'employer' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {result.type === 'worker' && <User size={16} />}
                                        {result.type === 'employer' && <Building2 size={16} />}
                                        {result.type === 'bill' && <Receipt size={16} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold truncate">{result.title}</div>
                                        <div className="text-xs text-slate-500 truncate">{result.subtitle}</div>
                                    </div>
                                    {index === activeIndex && <ArrowRight size={16} className="text-blue-500 opacity-50" />}
                                </button>
                            ))}
                        </div>
                    ) : (
                        query.length > 1 && !loading && (
                            <div className="text-center py-8 text-slate-500 text-sm">
                                No results found for "{query}"
                            </div>
                        )
                    )}

                    {query.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-slate-400 text-sm mb-2">Try searching for...</p>
                            <div className="flex justify-center gap-2 text-xs text-slate-500">
                                <span className="bg-slate-100 px-2 py-1 rounded">Name</span>
                                <span className="bg-slate-100 px-2 py-1 rounded">Passport</span>
                                <span className="bg-slate-100 px-2 py-1 rounded">ARC</span>
                                <span className="bg-slate-100 px-2 py-1 rounded">Tax ID</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
