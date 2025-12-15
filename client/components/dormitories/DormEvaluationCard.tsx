
import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface DormEvaluationCardProps {
    dorm: {
        id: string;
        name: string;
        address: string;
        capacity: number;
        currentOccupancy: number;
    };
    onQuickFix?: () => void;
}

export default function DormEvaluationCard({ dorm, onQuickFix }: DormEvaluationCardProps) {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        fetch(`http://localhost:3001/api/compliance/dormitories/${dorm.id}/health`)
            .then(res => res.json())
            .then(data => {
                setHealth(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [dorm.id]);

    if (loading) return <div className="p-4 bg-white rounded-xl border animate-pulse h-32" />;

    const isHealthy = health?.status === 'HEALTHY';
    const isCritical = health?.status === 'CRITICAL';

    // Status color logic
    const statusColor = isHealthy ? 'text-green-600 bg-green-50 border-green-200'
        : isCritical ? 'text-red-600 bg-red-50 border-red-200'
            : 'text-yellow-600 bg-yellow-50 border-yellow-200';

    return (
        <div className={`bg-white rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${isCritical ? 'border-red-300' : 'border-slate-200'}`}>
            <div className="p-5 flex justify-between items-start">
                <Link href={`/dormitories/${dorm.id}`} className="flex-1">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {dorm.name}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                            {dorm.address}
                        </p>
                        <div className="mt-3 flex gap-3 text-sm">
                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                {dorm.currentOccupancy} / {dorm.capacity} Beds
                            </span>
                        </div>
                    </div>
                </Link>

                <div className="flex flex-col items-end gap-2">
                    {/* Status Badge */}
                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 font-bold text-sm border ${statusColor}`}>
                        {isHealthy && <CheckCircle size={16} />}
                        {health?.status === 'WARNING' && <AlertTriangle size={16} />}
                        {isCritical && <AlertOctagon size={16} className={isCritical ? 'animate-pulse' : ''} />}
                        <span>{health?.status}</span>
                    </div>

                    {/* Score (Optional) */}
                    <div className="text-xs font-mono text-slate-400">
                        Score: {health?.score}/100
                    </div>
                </div>
            </div>

            {/* Action Area / Details */}
            {!isHealthy && (
                <div className="bg-slate-50 border-t border-slate-100 px-5 py-3">
                    <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => setExpanded(!expanded)}
                    >
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                            {health?.missingFields.length + health?.violations.length} Issues Found
                        </span>
                        <button className="text-slate-400 hover:text-slate-600">
                            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {expanded && (
                        <div className="mt-3 space-y-2">
                            {health?.missingFields.map((field: string) => (
                                <div key={field} className="text-sm text-red-600 bg-red-50/50 px-2 py-1 rounded flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    Missing: {field}
                                </div>
                            ))}
                            {health?.violations.map((v: any, idx: number) => (
                                <div key={idx} className="text-sm text-amber-700 bg-amber-50/50 px-2 py-1 rounded flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {v.message}
                                </div>
                            ))}

                            {/* Call to Action */}
                            <div className="mt-3 pt-2 border-t border-slate-200">
                                <Link href={`/dormitories/${dorm.id}?tab=compliance`} className="text-sm text-blue-600 font-bold hover:underline">
                                    Fix Issues &rarr;
                                </Link>
                                {/* Future: Batch Fix button here */}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
