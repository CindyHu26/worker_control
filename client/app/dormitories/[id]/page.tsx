"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
    Home, BedDouble, Plus, User,
    Droplet, Zap, FileText, CheckCircle, XCircle
} from 'lucide-react';
import DormComplianceTab from '@/components/dormitories/DormComplianceTab';

export default function DormitoryDetailPage() {
    const { id } = useParams();
    const [dorm, setDorm] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'compliance' | 'rooms' | 'meters'>('info');

    // Modal States
    const [selectedBed, setSelectedBed] = useState<any>(null); // For assignment
    const [workers, setWorkers] = useState<any[]>([]); // Available workers
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showRecordModal, setShowRecordModal] = useState(false); // For meters

    const fetchDormData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/dormitories/${id}/structure`);
            if (res.ok) {
                const data = await res.json();
                setDorm(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDormData();
    }, [id]);

    const handleAssignWorker = async (workerId: string) => {
        if (!selectedBed) return;
        try {
            const res = await fetch(`http://localhost:3001/api/dormitories/beds/${selectedBed.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workerId })
            });
            if (res.ok) {
                setShowAssignModal(false);
                fetchDormData(); // Refresh
            } else {
                alert('Failed to assign');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleUnassign = async (bedId: string) => {
        if (!confirm('確認移出此床位的人員？ (Confirm unassign?)')) return;
        try {
            const res = await fetch(`http://localhost:3001/api/dormitories/beds/${bedId}/unassign`, {
                method: 'POST'
            });
            if (res.ok) {
                fetchDormData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Helper to fetch available workers only when modal opens
    const fetchAvailableWorkers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/workers?status=active');
            if (res.ok) {
                const { data } = await res.json();
                // Filter those without beds? Ideally backend filters. For now clien-side.
                // Assuming fetching all active workers.
                setWorkers(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading dormitory...</div>;
    if (!dorm) return <div className="p-8 text-center text-slate-500">Dormitory not found</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
                <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                        <div className="p-4 bg-indigo-50 rounded-lg text-indigo-600">
                            <Home size={32} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{dorm.name}</h1>
                            <p className="text-slate-500 mt-1">{dorm.address}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm font-medium text-slate-600">
                                <span className="flex items-center gap-1"><User size={16} /> {dorm.landlordName}</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                                    {dorm.accommodationType || 'Rental'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-slate-900">{dorm.currentOccupancy} <span className="text-lg text-slate-400 font-normal">/ {dorm.capacity}</span></div>
                        <div className="text-sm text-slate-500 uppercase tracking-wider mt-1">Total Occupancy</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Home size={18} /> 基本資料 (Info)
                </button>
                <button
                    onClick={() => setActiveTab('compliance')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'compliance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <CheckCircle size={18} /> 合規與安檢 (Compliance)
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rooms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <BedDouble size={18} /> 房間與床位 (Rooms)
                </button>
                <button
                    onClick={() => setActiveTab('meters')}
                    className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'meters' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Zap size={18} /> 水電抄表 (Meters)
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div className="bg-white p-8 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                    <Home size={48} className="mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold">基本資料 (Basic Info)</h3>
                    <p className="mt-2 text-sm">此處可編輯地址、房東、租約等詳細資訊。</p>
                </div>
            )}

            {activeTab === 'compliance' && <DormComplianceTab dormId={id as string} onRefresh={fetchDormData} />}

            {activeTab === 'rooms' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> 空床 (Vacant)</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> 已入住 (Occupied)</div>
                        </div>
                        {/* <button className="text-blue-600 text-sm font-bold hover:underline">+ 新增房間</button> */}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {dorm.rooms?.map((room: any) => (
                            <div key={room.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                        <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                                        Room {room.roomNumber}
                                    </h3>
                                    <span className="text-xs font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                                        {room.currentHeadCount} / {room.capacity} 人
                                    </span>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {room.beds?.map((bed: any) => {
                                            const isOccupied = bed.status === 'occupied';
                                            return (
                                                <div
                                                    key={bed.id}
                                                    onClick={() => {
                                                        if (!isOccupied) {
                                                            setSelectedBed(bed);
                                                            fetchAvailableWorkers();
                                                            setShowAssignModal(true);
                                                        } else {
                                                            // Could show unassign menu
                                                            if (confirm(`Unassign ${bed.worker?.chineseName}?`)) handleUnassign(bed.id);
                                                        }
                                                    }}
                                                    className={`
                                                        p-3 rounded-lg border transition-all cursor-pointer relative group
                                                        ${isOccupied
                                                            ? 'bg-red-50 border-red-100 hover:border-red-300'
                                                            : 'bg-green-50 border-green-100 hover:border-green-300 hover:shadow-md'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-xs font-bold ${isOccupied ? 'text-red-700' : 'text-green-700'}`}>
                                                            Bed {bed.bedCode}
                                                        </span>
                                                        {isOccupied ? <User size={14} className="text-red-400" /> : <CheckCircle size={14} className="text-green-400" />}
                                                    </div>

                                                    {isOccupied ? (
                                                        <div className="truncate">
                                                            <div className="text-sm font-bold text-slate-800">{bed.worker?.chineseName || 'Unknown'}</div>
                                                            <div className="text-xs text-slate-500 truncate">{bed.worker?.englishName}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-green-600 font-medium py-1">
                                                            + 分配人員
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'meters' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-8 text-center text-slate-500">
                        <Zap size={48} className="mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-bold">Utility Meters</h3>
                        <p className="mt-2 text-sm">Feature coming in next update.</p>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">分配床位 (Assign Bed {selectedBed?.bedCode})</h3>
                            <button onClick={() => setShowAssignModal(false)}><XCircle className="text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="mb-4">
                            <input
                                className="w-full border p-2 rounded mb-2"
                                placeholder="Search worker name..."
                            // Simple filter logic could go here
                            />
                            <div className="h-64 overflow-y-auto border rounded divide-y divide-slate-100">
                                {workers.map(w => (
                                    <button
                                        key={w.id}
                                        onClick={() => handleAssignWorker(w.id)}
                                        className="w-full text-left p-3 hover:bg-blue-50 flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-bold text-sm text-slate-800">{w.chineseName} {w.englishName}</div>
                                            <div className="text-xs text-slate-500">{w.nationality}</div>
                                        </div>
                                        {w.dormitoryBedId && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Has Bed</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
