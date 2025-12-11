"use client";

import { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

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

    useEffect(() => {
        fetch('http://localhost:3001/api/dashboard/incidents')
            .then(res => res.json())
            .then(data => {
                setIncidents(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
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
                        <div key={incident.id} className="border border-orange-200 bg-orange-50 p-3 rounded">
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
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
