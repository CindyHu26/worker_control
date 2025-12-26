'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import PageContainer from '@/components/layout/PageContainer';
import LeadForm, { LeadFormData } from '@/components/crm/LeadForm';
import { LEAD_STATUSES, STATUS_COLORS, getIndustryLabel, getStatusLabel, LeadStatusKey } from '@/lib/leadConstants';
import { Plus, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface Lead {
    id: string;
    companyName: string | null;
    taxId: string | null;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    industry: string | null;
    status: string;
    estimatedWorkerCount: number | null;
    assignedTo: string | null;
    assignedUser?: {
        name: string;
    } | null;
    lastContactDate: string | null;
    nextFollowUpDate: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function LeadsPage() {
    const router = useRouter();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    useEffect(() => {
        fetchLeads();
    }, [statusFilter]);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'ALL') {
                params.append('status', statusFilter);
            }

            const token = Cookies.get('token');
            const res = await fetch(`/api/leads?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch leads');

            const data = await res.json();
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('載入潛在客戶列表失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (formData: LeadFormData) => {
        const token = Cookies.get('token');
        const res = await fetch('/api/leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '建立失敗');
        }

        toast.success('潛在客戶建立成功');
        fetchLeads();
    };

    const filteredLeads = leads.filter(lead => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            lead.companyName?.toLowerCase().includes(query) ||
            lead.taxId?.includes(query) ||
            lead.contactPerson?.toLowerCase().includes(query)
        );
    });

    return (
        <PageContainer
            title="潛在客戶"
            subtitle="管理業務開發與客戶轉換漏斗"
            actions={
                <Button onClick={() => setShowForm(true)} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    新增潛在客戶
                </Button>
            }
        >
            {/* Filters & Search */}
            <Card className="mb-6">
                <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="搜尋公司名稱、統編或聯絡人..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px] bg-white">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="狀態篩選" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">全部狀態</SelectItem>
                                {Object.entries(LEAD_STATUSES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Leads Table */}
            <Card>
                <CardHeader>
                    <CardTitle>客戶列表 ({filteredLeads.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">載入中...</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery || statusFilter !== 'ALL' ? '沒有符合條件的客戶' : '尚無潛在客戶，請點擊「新增潛在客戶」開始建檔'}
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-md border bg-white">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left border-b">
                                        <th className="p-3 font-medium">公司名稱</th>
                                        <th className="p-3 font-medium">統編</th>
                                        <th className="p-3 font-medium">產業別</th>
                                        <th className="p-3 font-medium">聯絡人</th>
                                        <th className="p-3 font-medium">聯絡方式</th>
                                        <th className="p-3 font-medium">預計人數</th>
                                        <th className="p-3 font-medium">狀態</th>
                                        <th className="p-3 font-medium">負責業務</th>
                                        <th className="p-3 font-medium">下次追蹤</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => (
                                        <tr
                                            key={lead.id}
                                            onClick={() => router.push(`/crm/leads/${lead.id}`)}
                                            className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <td className="p-3 font-medium">{lead.companyName || '-'}</td>
                                            <td className="p-3 text-sm text-gray-600">{lead.taxId || '-'}</td>
                                            <td className="p-3 text-sm">{getIndustryLabel(lead.industry)}</td>
                                            <td className="p-3 text-sm">{lead.contactPerson || '-'}</td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {lead.phone || lead.email || '-'}
                                            </td>
                                            <td className="p-3 text-sm text-center">
                                                {lead.estimatedWorkerCount || '-'}
                                            </td>
                                            <td className="p-3">
                                                <Badge className={STATUS_COLORS[lead.status as LeadStatusKey]}>
                                                    {getStatusLabel(lead.status)}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-sm">{lead.assignedUser?.name || '未分配'}</td>
                                            <td className="p-3 text-sm text-gray-600">
                                                {lead.nextFollowUpDate
                                                    ? new Date(lead.nextFollowUpDate).toLocaleDateString('zh-TW')
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Form Modal */}
            <LeadForm
                open={showForm}
                onClose={() => setShowForm(false)}
                onSubmit={handleCreateLead}
                mode="create"
            />
        </PageContainer>
    );
}
