
"use client";

import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, X } from 'lucide-react';
import CommentSystem from '../common/CommentSystem';
import { apiGet } from '@/lib/api';

interface Incident {
    id: string;
    description: string;
    severityLevel: string;
    status: string;
    incidentDate: string;
    worker?: { chineseName: string; englishName: string };
    employer?: { companyName: string };
}

export default function IncidentFeed() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    useEffect(() => {
        apiGet<Incident[]>('/api/dashboard/incidents')
            .then(data => {
                // Ensure data is an array
                setIncidents(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load incidents:', err);
                setIncidents([]);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-center">載入事件中...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-600">
                <ShieldAlert className="w-6 h-6" />
                最新重大事件
            </h2>
            <div className="space-y-3">
                {incidents.length === 0 ? (
                    <p className="text-gray-500 text-center">目前無重大事件</p>
                ) : (
                    incidents.map(incident => (
                        <div
                            key={incident.id}
                            onClick={() => setSelectedIncident(incident)}
                            className="border border-orange-200 bg-orange-50 p-3 rounded cursor-pointer hover:bg-orange-100 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                    ${incident.severityLevel === 'critical' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                                        {incident.severityLevel.toUpperCase()}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(incident.incidentDate).toLocaleDateString('zh-TW')}
                                    </span>
                                </div>
                                <span className="text-xs text-orange-800 bg-orange-200 px-2 py-0.5 rounded-full">
                                    {incident.status}
                                </span>
                            </div>
                            <p className="mt-2 text-gray-800 font-medium">{incident.description}</p>
                            {incident.worker && (
                                <p className="text-sm text-gray-600 mt-1">
                                    相關勞工: {incident.worker.chineseName || incident.worker.englishName}
                                </p>
                            )}
                            <p className="text-xs text-blue-600 mt-2 text-right">點擊查看討論 ▼</p>
                        </div>
                    ))
                )}
            </div>

            {/* Incident Details Modal */}
            {selectedIncident && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                            <h3 className="font-bold text-lg text-gray-900">
                                事件詳情
                                <span className="ml-2 text-sm text-gray-500 font-normal">
                                    {new Date(selectedIncident.incidentDate).toLocaleDateString()}
                                </span>
                            </h3>
                            <button onClick={() => setSelectedIncident(null)} className="text-gray-500 hover:text-gray-800">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4 border-b bg-orange-50">
                            <p className="font-medium text-lg">{selectedIncident.description}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-600">
                                {selectedIncident.worker && (
                                    <p>勞工: {selectedIncident.worker.chineseName}</p>
                                )}
                                {selectedIncident.employer && (
                                    <p>雇主: {selectedIncident.employer.companyName}</p>
                                )}
                                <p>嚴重度: {selectedIncident.severityLevel}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden p-4">
                            <CommentSystem recordId={selectedIncident.id} recordTable="incidents" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
