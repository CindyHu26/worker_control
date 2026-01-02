'use client';

import { useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AlertFeed from '@/components/dashboard/AlertFeed';
import IncidentFeed from '@/components/dashboard/IncidentFeed';
import { apiGet } from '@/lib/api';
import { Users, TrendingUp, FileText } from 'lucide-react';

interface DashboardStats {
    totalActiveWorkers: number;
    newEntriesThisMonth: number;
    birthdaysThisMonth: number;
    activeRecruitment: number;
    pendingDocuments: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiGet<DashboardStats>('/api/dashboard/stats')
            .then(statsData => {
                setStats(statsData);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to load dashboard data:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <StandardPageLayout title="儀表板" description="載入中...">
                <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="儀表板"
            description="系統總覽與關鍵指標"
        >
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                在職移工總數
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.totalActiveWorkers || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                目前在職服務中
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                本月新入境
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.newEntriesThisMonth || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                本月入境人數
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                有效招募函
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.activeRecruitment || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                尚有名額可用
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts and Incidents Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    <AlertFeed />
                    <IncidentFeed />
                </div>
            </div>
        </StandardPageLayout>
    );
}
