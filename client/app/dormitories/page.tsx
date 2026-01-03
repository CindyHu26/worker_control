"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Plus, MapPin, User, BedDouble, AlertCircle } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import DormEvaluationCard from '@/components/dormitories/DormEvaluationCard';
import BatchFixModal from '@/components/dormitories/BatchFixModal';

interface Dormitory {
    id: string;
    name: string;
    address: string;
    landlordName: string;
    landlordPhone: string;
    currentOccupancy: number;
    capacity: number;
}

export default function DormitoryListPage() {
    const [dorms, setDorms] = useState<Dormitory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDormForFix, setSelectedDormForFix] = useState<string | null>(null);

    // New Dorm Form State
    const [newDorm, setNewDorm] = useState({
        name: '',
        address: '',
        landlordName: '',
        landlordPhone: '',
        accommodationType: 'rented'
    });

    const fetchDorms = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:3001/api/dormitories');
            if (res.ok) {
                const data = await res.json();
                setDorms(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDorms();
    }, []);

    const handleCreate = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/dormitories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDorm)
            });
            if (res.ok) {
                setIsCreateModalOpen(false);
                setNewDorm({ name: '', address: '', landlordName: '', landlordPhone: '', accommodationType: 'rented' });
                fetchDorms();
            } else {
                alert('Failed to create');
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <StandardPageLayout
            title="ÂÆøË?ÁÆ°Á?"
            subtitle="ÁÆ°Á?ÂÆøË??öÈ??ÅÊàø?ìË?Â∫ä‰??ÜÈ?"
            actions={
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>?∞Â?ÂÆøË?</span>
                </button>
            }
        >

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : dorms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Â∞öÁÑ°ÂÆøË?Ë≥áÊ?</h3>
                    <p className="text-slate-500 mt-1">Ë´ãÈ??äÂè≥‰∏äË??∞Â?ÂÆøË???/p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dorms.map(dorm => (
                        <DormEvaluationCard
                            key={dorm.id}
                            dorm={dorm}
                            onQuickFix={() => setSelectedDormForFix(dorm.id)}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">?∞Â?ÂÆøË? (New Dormitory)</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ÂÆøË??çÁ®± (Name)</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newDorm.name}
                                    onChange={e => setNewDorm({ ...newDorm, name: e.target.value })}
                                    placeholder="e.g. ‰∏≠Â£¢‰∏ÄÂª†ÂÆø??
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">?∞Â? (Address)</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newDorm.address}
                                    onChange={e => setNewDorm({ ...newDorm, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">?øÊù±/ÁÆ°Á?‰∫?/label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newDorm.landlordName}
                                        onChange={e => setNewDorm({ ...newDorm, landlordName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">?ØÁµ°?ªË©±</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newDorm.landlordPhone}
                                        onChange={e => setNewDorm({ ...newDorm, landlordPhone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                            >
                                ?ñÊ?
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50"
                                disabled={!newDorm.name}
                            >
                                Âª∫Á?ÂÆøË?
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Fix Modal */}
            {selectedDormForFix && (
                <BatchFixModal
                    dormId={selectedDormForFix}
                    onClose={() => setSelectedDormForFix(null)}
                    onSuccess={() => {
                        setSelectedDormForFix(null);
                        alert('Batch update complete!');
                        fetchDorms();
                    }}
                />
            )}
        </StandardPageLayout>
    );
}
