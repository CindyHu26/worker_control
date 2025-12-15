
import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, Calendar, Ruler } from 'lucide-react';

interface DormComplianceTabProps {
    dormId: string;
    onRefresh: () => void;
}

export default function DormComplianceTab({ dormId, onRefresh }: DormComplianceTabProps) {
    const [dorm, setDorm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [totalArea, setTotalArea] = useState('');
    const [fireExpiry, setFireExpiry] = useState('');
    const [rooms, setRooms] = useState<any[]>([]);

    useEffect(() => {
        fetch(`http://localhost:3001/api/dormitories/${dormId}/structure`)
            .then(res => res.json())
            .then(data => {
                setDorm(data);
                setTotalArea(data.totalArea || '');
                setFireExpiry(data.fireSafetyExpiry ? data.fireSafetyExpiry.split('T')[0] : '');
                setRooms(data.rooms || []);
                setLoading(false);
            })
            .catch(console.error);
    }, [dormId]);

    const handleRoomAreaChange = (roomId: string, value: string) => {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, area: value } : r));
    };

    const handleSaveBasic = async () => {
        setSaving(true);
        try {
            await fetch(`http://localhost:3001/api/dormitories/${dormId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalArea: Number(totalArea),
                    fireSafetyExpiry: fireExpiry ? new Date(fireExpiry) : null
                })
            });
            alert('Basic info saved');
            onRefresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save basic info');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveRoom = async (room: any) => {
        try {
            await fetch(`http://localhost:3001/api/dormitories/rooms/${room.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ area: Number(room.area) })
            });
            // Show toast or slight indication?
        } catch (error) {
            console.error(error);
            alert('Failed to save room');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading compliance data...</div>;

    const daysToExpiry = fireExpiry ? Math.ceil((new Date(fireExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Section 1: Basic Safety Info */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="text-amber-500" />
                        Fire Safety & Building Info
                    </h3>
                    <button
                        onClick={handleSaveBasic}
                        disabled={saving}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                        Save Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Ruler size={16} /> Total Area (m²)
                        </label>
                        <input
                            type="number"
                            value={totalArea}
                            onChange={(e) => setTotalArea(e.target.value)}
                            className={`w-full border p-2 rounded-lg ${!totalArea ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                            placeholder="必填"
                        />
                        {!totalArea && <p className="text-xs text-red-500 mt-1">* 必填 (Required)</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Calendar size={16} /> Fire Safety Expiry
                        </label>
                        <input
                            type="date"
                            value={fireExpiry}
                            onChange={(e) => setFireExpiry(e.target.value)}
                            className="w-full border border-slate-300 p-2 rounded-lg"
                        />
                        {daysToExpiry !== null && daysToExpiry < 30 && (
                            <p className="text-xs text-red-600 font-bold mt-1">⚠️ Expires in {daysToExpiry} days!</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Room Density Check */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <CheckCircle className="text-blue-500" />
                    Room Density Analysis
                </h3>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold">
                            <tr>
                                <th className="p-3">Room</th>
                                <th className="p-3">Capacity</th>
                                <th className="p-3 w-48">Area (m²) <span className="text-red-500">*</span></th>
                                <th className="p-3">Density Check (Min 3.6m²)</th>
                                <th className="p-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rooms.map(room => {
                                const area = Number(room.area || 0);
                                const density = area > 0 && room.capacity > 0 ? area / room.capacity : 0;
                                const isViolation = density > 0 && density < 3.6;

                                return (
                                    <tr key={room.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-bold">{room.roomNumber}</td>
                                        <td className="p-3">{room.capacity} Pax</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={room.area || ''} // Handle null area
                                                onChange={(e) => handleRoomAreaChange(room.id, e.target.value)}
                                                className={`w-full border p-2 rounded ${!room.area ? 'border-red-400 bg-red-50' : isViolation ? 'border-amber-400 bg-amber-50' : 'border-slate-300'}`}
                                                placeholder="Required"
                                            />
                                            {isViolation && (
                                                <p className="text-xs text-amber-600 font-bold mt-1">
                                                    ⚠️ Only {density.toFixed(2)} m²/pax
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            {area === 0 ? (
                                                <span className="text-slate-400 italic">Enter area...</span>
                                            ) : isViolation ? (
                                                <div className="flex items-center gap-1 text-red-600 font-bold bg-red-100 px-2 py-1 rounded w-fit">
                                                    <AlertTriangle size={14} /> VIOLATION
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-green-600 font-bold bg-green-100 px-2 py-1 rounded w-fit">
                                                    <CheckCircle size={14} /> OK ({density.toFixed(2)})
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <button
                                                onClick={() => handleSaveRoom(room)}
                                                className="text-blue-600 font-bold hover:bg-blue-50 px-3 py-1 rounded"
                                            >
                                                Save
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
