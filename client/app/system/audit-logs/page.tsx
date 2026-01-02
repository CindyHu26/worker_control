'use client';

import { useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiGet } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface AuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    requestPath: string;
    requestMethod: string;
    ipAddress: string | null;
    pageViewDuration: number | null;
    changes: any;
    metadata: any;
    createdAt: string;
    user: {
        id: string;
        username: string;
        name: string;
    };
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        entityType: '',
        search: '',
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.action) params.append('action', filters.action);
            if (filters.entityType) params.append('entityType', filters.entityType);

            const data = await apiGet<AuditLog[]>(`/api/audit-logs?${params.toString()}`);
            setLogs(data);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            return (
                log.user.name.toLowerCase().includes(searchLower) ||
                log.user.username.toLowerCase().includes(searchLower) ||
                log.entityType.toLowerCase().includes(searchLower) ||
                log.requestPath.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'READ': return 'bg-blue-100 text-blue-800';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'PAGE_VIEW': return 'bg-purple-100 text-purple-800';
            case 'LOGIN': return 'bg-indigo-100 text-indigo-800';
            case 'LOGOUT': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDuration = (ms: number | null) => {
        if (!ms) return '-';
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes}分${seconds % 60}秒`;
        }
        return `${seconds}秒`;
    };

    return (
        <StandardPageLayout
            title="系統稽核日誌"
            description="查看所有用戶操作記錄與系統活動"
            actions={
                <Button onClick={fetchLogs} disabled={loading}>
                    {loading ? '載入中...' : '重新整理'}
                </Button>
            }
        >
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>篩選條件</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">操作類型</label>
                            <Select value={filters.action} onValueChange={(value) => {
                                setFilters({ ...filters, action: value });
                                setTimeout(fetchLogs, 100);
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="全部" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">全部</SelectItem>
                                    <SelectItem value="CREATE">新增</SelectItem>
                                    <SelectItem value="READ">讀取</SelectItem>
                                    <SelectItem value="UPDATE">更新</SelectItem>
                                    <SelectItem value="DELETE">刪除</SelectItem>
                                    <SelectItem value="PAGE_VIEW">頁面瀏覽</SelectItem>
                                    <SelectItem value="LOGIN">登入</SelectItem>
                                    <SelectItem value="LOGOUT">登出</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">實體類型</label>
                            <Input
                                placeholder="例如: worker, employer"
                                value={filters.entityType}
                                onChange={(e) => {
                                    setFilters({ ...filters, entityType: e.target.value });
                                }}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">搜尋</label>
                            <Input
                                placeholder="用戶、路徑..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">用戶</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">實體</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">路徑</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">停留時間</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            載入中...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            無符合條件的記錄
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatDistanceToNow(new Date(log.createdAt), {
                                                    addSuffix: true,
                                                    locale: zhTW,
                                                })}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium text-gray-900">{log.user.name}</div>
                                                <div className="text-gray-500">@{log.user.username}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getActionBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-mono text-xs">{log.entityType}</div>
                                                {log.entityId && (
                                                    <div className="text-gray-400 text-xs truncate max-w-[100px]">
                                                        {log.entityId}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-mono text-xs">
                                                <span className="text-blue-600">{log.requestMethod}</span>{' '}
                                                {log.requestPath}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatDuration(log.pageViewDuration)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                                                {log.ipAddress || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </StandardPageLayout>
    );
}
