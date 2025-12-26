'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, AlertCircle, Info, RefreshCw, Filter } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import AlertCard, { SystemAlert, AlertSeverity } from '@/components/alerts/AlertCard';

interface AlertSummary {
    critical: number;
    warning: number;
    info: number;
    total: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);
    const [summary, setSummary] = useState<AlertSummary>({ critical: 0, warning: 0, info: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [filter, setFilter] = useState<AlertSeverity | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'OPEN' | 'ALL'>('OPEN');

    const fetchAlerts = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'ALL') params.append('severity', filter);
            if (statusFilter !== 'ALL') params.append('status', statusFilter);

            const [alertsRes, summaryRes] = await Promise.all([
                fetch(`${API_BASE_URL}/alerts?${params.toString()}`),
                fetch(`${API_BASE_URL}/alerts/summary`),
            ]);

            if (alertsRes.ok) {
                const data = await alertsRes.json();
                setAlerts(data.data || []);
            }

            if (summaryRes.ok) {
                const data = await summaryRes.json();
                setSummary(data.data || { critical: 0, warning: 0, info: 0, total: 0 });
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, statusFilter]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            const res = await fetch(`${API_BASE_URL}/alerts/generate`, {
                method: 'POST',
            });
            if (res.ok) {
                const data = await res.json();
                alert(`已產生 ${data.count} 則新警示`);
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error generating alerts:', error);
        } finally {
            setGenerating(false);
        }
    };

    const handleAcknowledge = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/alerts/${id}/acknowledge`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000' }),
            });
            if (res.ok) {
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error acknowledging alert:', error);
        }
    };

    const handleResolve = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/alerts/${id}/resolve`, {
                method: 'PATCH',
            });
            if (res.ok) {
                fetchAlerts();
            }
        } catch (error) {
            console.error('Error resolving alert:', error);
        }
    };

    const filteredAlerts = alerts;
    const criticalAlerts = filteredAlerts.filter(a => a.severity === 'CRITICAL');
    const warningAlerts = filteredAlerts.filter(a => a.severity === 'WARNING');
    const infoAlerts = filteredAlerts.filter(a => a.severity === 'INFO');

    return (
        <PageContainer
            title="異常儀表板"
            subtitle="跨部門異常監控與追蹤"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '異常儀表板' },
            ]}
            actions={
                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                        {generating ? '產生中...' : '重新掃描'}
                    </button>
                </div>
            }
        >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <button
                    onClick={() => setFilter('ALL')}
                    className={`p-4 rounded-xl border transition-all ${filter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">全部待處理</p>
                            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                        </div>
                        <Filter className="w-8 h-8 text-gray-400" />
                    </div>
                </button>

                <button
                    onClick={() => setFilter('CRITICAL')}
                    className={`p-4 rounded-xl border transition-all ${filter === 'CRITICAL' ? 'ring-2 ring-red-500 bg-red-50' : 'bg-white hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600">🔴 緊急</p>
                            <p className="text-2xl font-bold text-red-700">{summary.critical}</p>
                        </div>
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                </button>

                <button
                    onClick={() => setFilter('WARNING')}
                    className={`p-4 rounded-xl border transition-all ${filter === 'WARNING' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'bg-white hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-yellow-600">🟡 警告</p>
                            <p className="text-2xl font-bold text-yellow-700">{summary.warning}</p>
                        </div>
                        <AlertCircle className="w-8 h-8 text-yellow-400" />
                    </div>
                </button>

                <button
                    onClick={() => setFilter('INFO')}
                    className={`p-4 rounded-xl border transition-all ${filter === 'INFO' ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white hover:shadow-md'
                        }`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600">🔵 資訊</p>
                            <p className="text-2xl font-bold text-blue-700">{summary.info}</p>
                        </div>
                        <Info className="w-8 h-8 text-blue-400" />
                    </div>
                </button>
            </div>

            {/* Status Filter */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setStatusFilter('OPEN')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'OPEN'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    待處理
                </button>
                <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === 'ALL'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    全部
                </button>
            </div>

            {/* Alerts Grid */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">目前沒有異常警示</p>
                    <p className="text-sm">點擊「重新掃描」來檢查系統異常</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Critical Column */}
                    {(filter === 'ALL' || filter === 'CRITICAL') && (
                        <div>
                            <h2 className="text-lg font-bold text-red-700 flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5" />
                                🔴 緊急 ({criticalAlerts.length})
                            </h2>
                            <div className="space-y-3">
                                {criticalAlerts.map(alert => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onAcknowledge={handleAcknowledge}
                                        onResolve={handleResolve}
                                    />
                                ))}
                                {criticalAlerts.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 text-sm">無緊急警示</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Warning Column */}
                    {(filter === 'ALL' || filter === 'WARNING') && (
                        <div>
                            <h2 className="text-lg font-bold text-yellow-700 flex items-center gap-2 mb-4">
                                <AlertCircle className="w-5 h-5" />
                                🟡 警告 ({warningAlerts.length})
                            </h2>
                            <div className="space-y-3">
                                {warningAlerts.map(alert => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onAcknowledge={handleAcknowledge}
                                        onResolve={handleResolve}
                                    />
                                ))}
                                {warningAlerts.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 text-sm">無警告事項</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Info Column */}
                    {(filter === 'ALL' || filter === 'INFO') && (
                        <div>
                            <h2 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5" />
                                🔵 資訊 ({infoAlerts.length})
                            </h2>
                            <div className="space-y-3">
                                {infoAlerts.map(alert => (
                                    <AlertCard
                                        key={alert.id}
                                        alert={alert}
                                        onAcknowledge={handleAcknowledge}
                                        onResolve={handleResolve}
                                    />
                                ))}
                                {infoAlerts.length === 0 && (
                                    <p className="text-center py-8 text-gray-400 text-sm">無待辦資訊</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </PageContainer>
    );
}
