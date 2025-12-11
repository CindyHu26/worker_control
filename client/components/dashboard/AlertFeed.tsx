"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Calendar } from 'lucide-react';

interface Alert {
    id: string;
    workerName: string;
    companyName: string;
    alertType: string;
    dueDate: string;
    daysRemaining: number;
}

export default function AlertFeed() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3001/api/dashboard/alerts')
            .then(res => res.json())
            .then(data => {
                setAlerts(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-4 text-center">載入警示中...</div>;

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-600">
                <AlertCircle className="w-6 h-6" />
                緊急待辦事項
            </h2>
            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <p className="text-gray-500 text-center">目前無緊急事項</p>
                ) : (
                    alerts.map(alert => (
                        <div key={alert.id} className="border-l-4 border-red-500 bg-red-50 p-3 rounded flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{alert.alertType}</p>
                                <p className="text-sm text-gray-600">
                                    {alert.workerName} - {alert.companyName}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                                    剩 {alert.daysRemaining} 天
                                </span>
                                <p className="text-xs text-gray-500 mt-1">
                                    {new Date(alert.dueDate).toLocaleDateString('zh-TW')}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
