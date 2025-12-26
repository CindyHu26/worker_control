'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, AlertCircle, Info, Clock, CheckCircle, ExternalLink } from 'lucide-react';

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface SystemAlert {
    id: string;
    entityType: string;
    entityId: string;
    severity: AlertSeverity;
    title: string;
    description?: string;
    dueDate?: string;
    alertType: string;
    status: AlertStatus;
    acknowledgedAt?: string;
    resolvedAt?: string;
    createdAt: string;
}

interface AlertCardProps {
    alert: SystemAlert;
    onAcknowledge?: (id: string) => void;
    onResolve?: (id: string) => void;
}

const severityConfig: Record<AlertSeverity, {
    icon: React.ElementType;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
    label: string;
}> = {
    CRITICAL: {
        icon: AlertTriangle,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-500',
        label: '緊急',
    },
    WARNING: {
        icon: AlertCircle,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-500',
        label: '警告',
    },
    INFO: {
        icon: Info,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-500',
        label: '資訊',
    },
};

const entityTypeLabels: Record<string, string> = {
    WORKER: '移工',
    EMPLOYER: '雇主',
    DEPLOYMENT: '派工',
    JOB_ORDER: '招募訂單',
    LEAD: '潛在客戶',
};

function getEntityLink(entityType: string, entityId: string): string {
    switch (entityType) {
        case 'WORKER':
            return `/workers/${entityId}`;
        case 'EMPLOYER':
            return `/employers/${entityId}`;
        case 'DEPLOYMENT':
            return `/deployments/${entityId}`;
        case 'JOB_ORDER':
            return `/job-orders/${entityId}`;
        case 'LEAD':
            return `/crm/leads/${entityId}`;
        default:
            return '#';
    }
}

export default function AlertCard({ alert, onAcknowledge, onResolve }: AlertCardProps) {
    const config = severityConfig[alert.severity];
    const Icon = config.icon;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4 mb-3 transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <Icon className={`w-5 h-5 ${config.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`font-semibold ${config.textColor} text-sm truncate`}>
                            {alert.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                            {config.label}
                        </span>
                    </div>

                    {/* Description */}
                    {alert.description && (
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {alert.description}
                        </p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {/* Due Date */}
                        {alert.dueDate && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                到期: {formatDate(alert.dueDate)}
                            </span>
                        )}

                        {/* Entity Link */}
                        <Link
                            href={getEntityLink(alert.entityType, alert.entityId)}
                            className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                            <ExternalLink className="w-3 h-3" />
                            查看{entityTypeLabels[alert.entityType] || '詳情'}
                        </Link>

                        {/* Status */}
                        {alert.status === 'ACKNOWLEDGED' && (
                            <span className="flex items-center gap-1 text-orange-600">
                                <CheckCircle className="w-3 h-3" />
                                已確認
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {alert.status === 'OPEN' && (
                    <div className="flex flex-col gap-2">
                        {onAcknowledge && (
                            <button
                                onClick={() => onAcknowledge(alert.id)}
                                className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                確認
                            </button>
                        )}
                        {onResolve && (
                            <button
                                onClick={() => onResolve(alert.id)}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                解決
                            </button>
                        )}
                    </div>
                )}

                {alert.status === 'ACKNOWLEDGED' && onResolve && (
                    <button
                        onClick={() => onResolve(alert.id)}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        解決
                    </button>
                )}
            </div>
        </div>
    );
}
