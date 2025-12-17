
import React, { useEffect, useState } from 'react';
import { X, Calendar, FileText } from 'lucide-react';
import HealthTimeline from './HealthTimeline';
import AbnormalTrackingLog from './AbnormalTrackingLog';

interface HealthCheckDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkId: string | null;
}

export default function HealthCheckDetailModal({ isOpen, onClose, checkId }: HealthCheckDetailModalProps) {
    const [auditData, setAuditData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && checkId) {
            fetchDetail();
        } else {
            setAuditData(null);
        }
    }, [isOpen, checkId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3001/api/health-checks/${checkId}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setAuditData(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (content: string) => {
        if (!checkId) return;
        try {
            const res = await fetch(`http://localhost:3001/api/health-checks/${checkId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }), // userId handled by session/backend default
                credentials: 'include'
            });
            if (res.ok) {
                fetchDetail(); // Refresh logs
            }
        } catch (error) {
            console.error(error);
            alert('Failed to add comment');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto py-10">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl relative animate-in fade-in zoom-in-95 duration-200 my-auto">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-500 z-10">
                    <X size={24} />
                </button>

                <div className="p-8">
                    {loading || !auditData ? (
                        <div className="flex justify-center items-center h-64 text-slate-400">Loading details...</div>
                    ) : (
                        <>
                            {/* Header Info */}
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                                    {auditData.worker?.englishName}
                                    <span className="text-base font-normal text-slate-500 ml-2">({auditData.worker?.chineseName})</span>
                                </h2>
                                <div className="text-slate-500">
                                    {auditData.deployment?.employer?.companyName} • {auditData.worker?.id}
                                </div>
                            </div>

                            {/* Timeline */}
                            <HealthTimeline
                                entryDate={auditData.deployment?.entryDate || auditData.deployment?.startDate} // Fallback to start if entry missing
                                checks={auditData.deployment?.healthChecks || []}
                            />

                            {/* Current Check Status Card */}
                            <div className={`p-6 rounded-xl border mb-6 ${auditData.result === 'fail' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
                                }`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                            <h3 className="font-bold text-lg text-slate-800">
                                                目前關注：{auditData.checkType} 健康檢查
                                            </h3>
                                            {auditData.result === 'fail' && (
                                                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold">檢查不合格</span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 mt-4">
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">體檢日期</div>
                                                <div className="font-medium text-slate-900 text-lg">
                                                    {auditData.checkDate ? auditData.checkDate.split('T')[0] : '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1">體檢醫院</div>
                                                <div className="font-medium text-slate-900 text-lg">
                                                    {auditData.hospitalName || '未指定'}
                                                </div>
                                            </div>
                                            {auditData.failReason && (
                                                <div className="col-span-2">
                                                    <div className="text-xs text-slate-500 mb-1">異常項目</div>
                                                    <span className="inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        {auditData.failReason}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Audit Log */}
                            <AbnormalTrackingLog
                                checkId={auditData.id}
                                comments={auditData.comments || []}
                                onAddComment={handleAddComment}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
