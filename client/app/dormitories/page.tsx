"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Plus, MapPin, User, BedDouble, AlertCircle } from 'lucide-react';

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
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">宿舍管理 (Dormitories)</h1>
                    <p className="text-slate-500 mt-2">管理宿舍據點、房間與床位分配</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm hover:shadow"
                >
                    <Plus size={20} />
                    <span>新增宿舍</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : dorms.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Home size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">尚無宿舍資料</h3>
                    <p className="text-slate-500 mt-1">請點擊右上角新增宿舍。</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dorms.map(dorm => (
                        <Link key={dorm.id} href={`/dormitories/${dorm.id}`}>
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 group hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <Home size={24} />
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${(dorm.currentOccupancy / (dorm.capacity || 1)) > 0.9
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-green-100 text-green-700'
                                        }`}>
                                        {dorm.capacity > 0 ? `${Math.round((dorm.currentOccupancy / dorm.capacity) * 100)}% 滿` : 'N/A'}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-900 mb-2 truncate">{dorm.name}</h3>

                                <div className="space-y-2 text-sm text-slate-500 mb-6">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="mt-0.5 shrink-0" />
                                        <span className="line-clamp-2">{dorm.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <User size={16} />
                                        <span>{dorm.landlordName} ({dorm.landlordPhone})</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Occupancy</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-slate-900">{dorm.currentOccupancy}</span>
                                            <span className="text-sm text-slate-400">/ {dorm.capacity} 床</span>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <BedDouble size={20} />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">新增宿舍 (New Dormitory)</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">宿舍名稱 (Name)</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newDorm.name}
                                    onChange={e => setNewDorm({ ...newDorm, name: e.target.value })}
                                    placeholder="e.g. 中壢一廠宿舍"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">地址 (Address)</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={newDorm.address}
                                    onChange={e => setNewDorm({ ...newDorm, address: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">房東/管理人</label>
                                    <input
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={newDorm.landlordName}
                                        onChange={e => setNewDorm({ ...newDorm, landlordName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">聯絡電話</label>
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
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm disabled:opacity-50"
                                disabled={!newDorm.name}
                            >
                                建立宿舍
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
