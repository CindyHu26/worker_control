"use client";

import React, { useState } from 'react';
import { Plane, Calendar, AlertCircle } from 'lucide-react';

interface ArrivalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (flightInfo: { flightNumber: string; arrivalDate: string }) => void;
}

export default function ArrivalModal({ isOpen, onClose, onSubmit }: ArrivalModalProps) {
    const [flightNumber, setFlightNumber] = useState('');
    const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!flightNumber || !arrivalDate) return alert('Please fill in all fields');
        onSubmit({ flightNumber, arrivalDate });
        // Reset
        setFlightNumber('');
        setArrivalDate(new Date().toISOString().split('T')[0]);
        onClose();
    };

    // Calculate deadline preview
    const arrival = new Date(arrivalDate);
    const deadline = new Date(arrival);
    deadline.setDate(arrival.getDate() + 3);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Plane className="text-blue-600" />
                    Confirm Arrival Details
                </h2>

                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-sm text-blue-800 mb-6">
                    <p className="flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span>System will automatically calculate medical check deadlines based on arrival date.</span>
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Flight Number</label>
                        <input
                            type="text"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. BR-1234"
                            value={flightNumber}
                            onChange={(e) => setFlightNumber(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Arrival Date</label>
                        <input
                            type="date"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500"
                            value={arrivalDate}
                            onChange={(e) => setArrivalDate(e.target.value)}
                        />
                    </div>

                    {/* Preview Calculation */}
                    <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm">
                        <p className="font-bold text-slate-700 flex items-center gap-2 mb-1">
                            <Calendar size={14} /> Deadline Preview:
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                            <span>Entry Med Check:</span>
                            <span className="font-mono text-red-600 font-bold">
                                {deadline.toISOString().split('T')[0]} (Arrival + 3 days)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">
                        Confirm & Move
                    </button>
                </div>
            </div>
        </div>
    );
}
