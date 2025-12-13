"use client";

import React, { useState, useEffect } from 'react';
import { FileText, X, FolderOpen, Loader2 } from 'lucide-react';

interface BatchDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    workerIds: string[];
}

export default function BatchDocumentModal({ isOpen, onClose, workerIds }: BatchDocumentModalProps) {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('general');

    // Fetch categories on mount or open
    useEffect(() => {
        if (isOpen) {
            // Simplify: Hardcode or just fetch all templates to get categories?
            // For now let's just use 'general', 'recruitment', 'transfer' as hardcoded options
            // or fetch from API.
            setCategories(['general', 'recruitment', 'transfer', 'labor_insurance']);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/documents/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workerIds,
                    category: selectedCategory
                    // No templateIds implies All in Category
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Batch_Documents_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                onClose();
            } else {
                const err = await res.json();
                alert('Generation failed: ' + err.error);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to generate documents');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <FileText className="text-blue-600" />
                        Batch Document Generation
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-slate-600 mb-4">
                        You are about to generate documents for <span className="font-bold text-slate-900">{workerIds.length}</span> workers.
                    </p>

                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Document Category
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-2 rounded-lg border text-left flex items-center gap-2 transition
                                    ${selectedCategory === cat
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }
                                `}
                            >
                                <FolderOpen size={16} className={selectedCategory === cat ? 'text-blue-500' : 'text-slate-400'} />
                                <span className="capitalize">{cat.replace('_', ' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Generating...' : 'Generate ZIP'}
                    </button>
                </div>
            </div>
        </div>
    );
}
