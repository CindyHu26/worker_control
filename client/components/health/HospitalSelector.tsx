
"use client";

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';

interface Hospital {
    id: string;
    code: string | null;
    name: string;
    city: string | null;
    country: string | null;
    validUntil: string | null;
    isGeneral: boolean;
    isXray: boolean;
}

interface HospitalSelectorProps {
    value: string; // Hospital Name
    onChange: (name: string) => void;
    type?: 'general' | 'xray';
    label?: string;
    required?: boolean;
    onSelect?: (hospital: Hospital) => void;
}

export default function HospitalSelector({ value, onChange, type = 'general', label = "體檢醫院", required = false, onSelect }: HospitalSelectorProps) {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showList, setShowList] = useState(false);

    // Status of selected hospital
    const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
    const [warning, setWarning] = useState<string | null>(null);

    useEffect(() => {
        fetchHospitals();
    }, [type]);

    useEffect(() => {
        // When value changes (parent controlled), try to match to a hospital for validation
        if (value && hospitals.length > 0) {
            const match = hospitals.find(h => h.name === value);
            setSelectedHospital(match || null);
            validateHospital(match || null);
        } else {
            setSelectedHospital(null);
            setWarning(null);
        }
    }, [value, hospitals]);

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/hospitals?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                setHospitals(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const validateHospital = (h: Hospital | null) => {
        if (!h) {
            // User manually typed something not in list?
            if (value && !h) {
                setWarning('此醫院不在指定名單內，請確認是否正確。');
            } else {
                setWarning(null);
            }
            return;
        }

        if (h.validUntil) {
            const validDate = new Date(h.validUntil);
            const today = new Date();
            if (validDate < today) {
                setWarning(`該醫院指定效期已過 (${h.validUntil.split('T')[0]})，請確認。`);
            } else {
                setWarning(null);
            }
        } else {
            setWarning(null);
        }
    };

    // Filtered list
    const filtered = hospitals.filter(h =>
        h.name.includes(searchTerm) || (h.city && h.city.includes(searchTerm)) || (h.code && h.code.includes(searchTerm))
    );

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <div className="relative">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setSearchTerm(e.target.value);
                        setShowList(true);
                    }}
                    onFocus={() => setShowList(true)}
                    onBlur={() => setTimeout(() => setShowList(false), 200)} // Delay to allow click
                    placeholder="輸入醫院名稱或選擇..."
                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 ${warning ? 'border-yellow-400 focus:ring-yellow-200' : 'border-slate-300 focus:ring-blue-500'}`}
                />

                {/* Validation Status Icon */}
                <div className="absolute right-3 top-2.5 text-slate-400">
                    {warning ? (
                        <AlertTriangle size={18} className="text-yellow-500" />
                    ) : selectedHospital ? (
                        <CheckCircle size={18} className="text-green-500" />
                    ) : (
                        <Search size={18} />
                    )}
                </div>
            </div>

            {/* Validation Message */}
            {warning && (
                <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    {warning}
                </div>
            )}

            {/* Dropdown List */}
            {showList && filtered.length > 0 && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                    {filtered.map(h => (
                        <div
                            key={h.id}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0"
                            onClick={() => {
                                onChange(h.name);
                                if (onSelect) onSelect(h);
                                setSearchTerm('');
                                setShowList(false);
                            }}
                        >
                            <div className="font-medium text-slate-800">{h.name}</div>
                            <div className="text-xs text-slate-500 flex justify-between">
                                <span>{h.city}</span>
                                {h.validUntil && (
                                    <span className={new Date(h.validUntil) < new Date() ? 'text-red-500' : 'text-green-600'}>
                                        效期: {h.validUntil.split('T')[0]}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showList && filtered.length === 0 && searchTerm && (
                <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 p-3 text-center text-sm text-slate-500">
                    找不到相關醫院
                </div>
            )}
        </div>
    );
}
