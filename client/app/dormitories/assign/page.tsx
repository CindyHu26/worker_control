'use client';

import React, { useState, useEffect } from 'react';
import { Bed, ArrowLeft, Search, User, UserPlus, X, Home } from 'lucide-react';
import Link from 'next/link';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface Worker {
    id: string;
    chineseName: string | null;
    englishName: string;
    gender: string | null;
}

interface DormitoryBed {
    id: string;
    bedCode: string;
    isOccupied: boolean;
    worker?: Worker;
}

interface DormitoryRoom {
    id: string;
    roomNumber: string;
    capacity: number;
    beds: DormitoryBed[];
}

interface Dormitory {
    id: string;
    name: string;
    accommodationType: string;
    rooms: DormitoryRoom[];
}

interface DormOption {
    id: string;
    name: string;
}

export default function DormAssignPage() {
    const [dorms, setDorms] = useState<DormOption[]>([]);
    const [selectedDormId, setSelectedDormId] = useState<string>('');
    const [currentDorm, setCurrentDorm] = useState<Dormitory | null>(null);
    const [loading, setLoading] = useState(false);

    // Modal State
    const [selectedBed, setSelectedBed] = useState<DormitoryBed | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Worker[]>([]);
    const [searching, setSearching] = useState(false);

    // Initial Load: List Dorms
    useEffect(() => {
        fetch('/api/dormitories')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setDorms(data);
                    setSelectedDormId(data[0].id); // Default select first
                }
            })
            .catch(err => console.error(err));
    }, []);

    // Load Dorm Structure when ID changes
    useEffect(() => {
        if (!selectedDormId) return;
        setLoading(true);
        fetch(`/api/dormitories/${selectedDormId}/structure`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load dorm');
                return res.json();
            })
            .then(data => setCurrentDorm(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [selectedDormId]);

    // Search Workers
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            setSearching(true);
            fetch(`/api/workers?q=${searchQuery}&status=active`) // Filter active only?
                .then(res => res.json())
                .then(data => {
                    setSearchResults(data.data || []);
                })
                .catch(err => console.error(err))
                .finally(() => setSearching(false));
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleBedClick = (bed: DormitoryBed) => {
        setSelectedBed(bed);
        setShowAssignModal(true);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleAssign = async (workerId: string) => {
        if (!selectedBed) return;
        try {
            const res = await fetch(`/api/dormitories/beds/${selectedBed.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerId })
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Assignment failed');
                return;
            }

            // Refresh Dorm Data
            reloadDorm();
            setShowAssignModal(false);
        } catch (error) {
            console.error(error);
            alert('Failed to assign');
        }
    };

    const handleUnassign = async () => {
        if (!selectedBed) return;
        if (!confirm('Are you sure you want to unassign this worker?')) return;

        try {
            const res = await fetch(`/api/dormitories/beds/${selectedBed.id}/unassign`, {
                method: 'POST'
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || 'Unassignment failed');
                return;
            }

            reloadDorm();
            setShowAssignModal(false);
        } catch (error) {
            console.error(error);
            alert('Failed to unassign');
        }
    };

    const reloadDorm = () => {
        if (selectedDormId) {
            fetch(`/api/dormitories/${selectedDormId}/structure`)
                .then(res => res.json())
                .then(data => setCurrentDorm(data));
        }
    };

    return (
        <StandardPageLayout title="Â∫ä‰??ÜÈ?ÁÆ°Á? (Bed Assignment)" showBack onBack={() => window.location.href = '/portal'}>

            {/* Control Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Home className="text-slate-500" size={20} />
                    <span className="font-medium text-slate-700">?∏Ê?ÂÆøË?:</span>
                </div>
                <select
                    className="border rounded-md px-3 py-2 min-w-[200px]"
                    value={selectedDormId}
                    onChange={(e) => setSelectedDormId(e.target.value)}
                >
                    {dorms.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                    {dorms.length === 0 && <option>?°ÂÆø?çË???(No Dorms)</option>}
                </select>

                {currentDorm && (
                    <div className="text-sm text-slate-500 ml-auto">
                        È°ûÂ?: {currentDorm.accommodationType || '‰∏Ä?¨ÂÆø??}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">ËºâÂÖ•‰∏?..</div>
            ) : !currentDorm ? (
                <div className="text-center py-12 text-slate-400">Ë´ãÈÅ∏?áÂÆø?ç‰ª•Ê™¢Ë?Â∫ä‰?</div>
            ) : (
                <div className="space-y-6">
                    {currentDorm.rooms.map(room => (
                        <div key={room.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-semibold text-slate-700">?øË?: {room.roomNumber}</h3>
                                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded">
                                    {room.beds.filter(b => b.isOccupied).length} / {room.capacity} ‰∫?
                                </span>
                            </div>
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {room.beds.map(bed => (
                                    <div
                                        key={bed.id}
                                        onClick={() => handleBedClick(bed)}
                                        className={`
                                            relative border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
                                            flex flex-col items-center justify-center gap-2 aspect-square
                                            ${bed.isOccupied
                                                ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                            }
                                        `}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center
                                            ${bed.isOccupied ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}
                                        `}>
                                            <Bed size={16} />
                                        </div>
                                        <span className="font-mono font-bold text-slate-700">{bed.bedCode}</span>
                                        {bed.isOccupied && bed.worker ? (
                                            <div className="text-xs text-center">
                                                <div className="font-medium text-blue-900 truncate w-20">{bed.worker.englishName.split(' ')[0]}</div>
                                                <div className="text-blue-700 truncate w-20">{bed.worker.chineseName}</div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">‰∏ªË?Á©∫È?</span>
                                        )}
                                    </div>
                                ))}
                                {/* Fillers if beds < capacity? Usually pre-generated so no need */}
                            </div>
                        </div>
                    ))}
                    {currentDorm.rooms.length === 0 && (
                        <div className="text-center py-12 text-slate-500">Ê≠§ÂÆø?çÂ??°Êàø?ìË???/div>
                    )}
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && selectedBed && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800">
                                    Â∫ä‰?: {selectedBed.bedCode}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    ?Ä?? {selectedBed.isOccupied ? 'Â∑≤Â??? : 'Á©∫È?'}
                                </p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6">
                            {selectedBed.isOccupied && selectedBed.worker ? (
                                <div className="text-center py-4">
                                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <User size={32} />
                                    </div>
                                    <h4 className="font-bold text-lg">{selectedBed.worker.englishName}</h4>
                                    <p className="text-slate-600 mb-6">{selectedBed.worker.chineseName}</p>

                                    <button
                                        onClick={handleUnassign}
                                        className="w-full bg-red-50 text-red-600 border border-red-200 py-2 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                        ?ñÊ??ÜÈ? (Unassign)
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="?úÂ?ÁßªÂ∑•ÂßìÂ?..."
                                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
                                        {searching ? (
                                            <div className="p-4 text-center text-slate-500">?úÂ?‰∏?..</div>
                                        ) : searchResults.length > 0 ? (
                                            searchResults.map(worker => (
                                                <button
                                                    key={worker.id}
                                                    onClick={() => handleAssign(worker.id)}
                                                    className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="font-medium text-slate-900">{worker.englishName}</div>
                                                        <div className="text-sm text-slate-500">{worker.chineseName}</div>
                                                    </div>
                                                    <UserPlus size={18} className="text-slate-300 group-hover:text-green-600" />
                                                </button>
                                            ))
                                        ) : searchQuery ? (
                                            <div className="p-4 text-center text-slate-500">?°Ê?Â∞ãÁ???/div>
                                        ) : (
                                            <div className="p-4 text-center text-slate-400 text-sm">Ë´ãËº∏?•È??µÂ??úÂ?</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </StandardPageLayout>
    );
}
