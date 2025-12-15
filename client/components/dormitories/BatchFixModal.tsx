
import React, { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface BatchFixModalProps {
    dormId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function BatchFixModal({ dormId, onClose, onSuccess }: BatchFixModalProps) {
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Fetch rooms structure to find missing areas
        fetch(`http://localhost:3001/api/dormitories/${dormId}/structure`)
            .then(res => res.json())
            .then(data => {
                // Filter only rooms with missing area or where we want to edit
                // For "Fix Wizard", prioritize missing ones but maybe show all?
                // Let's show all for now so user can see density.
                setRooms(data.rooms || []);
                setLoading(false);
            })
            .catch(console.error);
    }, [dormId]);

    const handleAreaChange = (roomId: string, value: string) => {
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, area: value } : r));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Batch update logic
            // We probably need a batch update endpoint or loop requests.
            // Loop for now is simpler to implement without new backend route.
            const updates = rooms
                .filter(r => r.area) // Only update if area is present
                .map(r => fetch(`http://localhost:3001/api/dormitories/rooms/${r.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ area: Number(r.area) })
                }));

            await Promise.all(updates);
            alert('Saved successfully!');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">快速補資料精靈 (Quick Fix Wizard)</h2>
                        <p className="text-slate-500 text-sm">請補齊房間面積以計算居住密度合規性</p>
                    </div>
                    <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="flex-1 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0">
                            <tr>
                                <th className="p-3">Room</th>
                                <th className="p-3">Capacity</th>
                                <th className="p-3 w-32">Area (m²)</th>
                                <th className="p-3">Analysis (Density)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rooms.map(room => {
                                const area = Number(room.area || 0);
                                const density = area > 0 && room.capacity > 0 ? (area / room.capacity).toFixed(2) : '-';
                                const isViolation = area > 0 && room.capacity > 0 && (area / room.capacity) < 3.6;

                                return (
                                    <tr key={room.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-bold text-slate-700">{room.roomNumber}</td>
                                        <td className="p-3">{room.capacity} 人</td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                className={`w-full border p-1 rounded font-mono ${!room.area ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                                                value={room.area || ''}
                                                onChange={e => handleAreaChange(room.id, e.target.value)}
                                                placeholder="Required"
                                            />
                                        </td>
                                        <td className="p-3">
                                            {isViolation ? (
                                                <div className="flex items-center gap-1 text-red-600 font-bold">
                                                    <AlertTriangle size={14} />
                                                    {density} m²/人 (違規)
                                                </div>
                                            ) : area > 0 ? (
                                                <div className="flex items-center gap-1 text-green-600 font-bold">
                                                    <CheckCircle size={14} />
                                                    {density} m²/人 (OK)
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-sm flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Batch Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
