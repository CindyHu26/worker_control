'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
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

            const data = await apiRequest(`/api/leads?${params.toString()}`);
            setLeads(data);
        } catch (error) {
            console.error('Error fetching leads:', error);
            toast.error('ËºâÂÖ•ÊΩõÂú®ÂÆ¢Êà∂?óË°®Â§±Ê?');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLead = async (formData: LeadFormData) => {
        await apiRequest('/api/leads', {
            method: 'POST',
            body: JSON.stringify(formData)
        });

        toast.success('ÊΩõÂú®ÂÆ¢Êà∂Âª∫Á??êÂ?');
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
        <StandardPageLayout
            title="ÊΩõÂú®ÂÆ¢Êà∂"
            subtitle="ÁÆ°Á?Ê•≠Â??ãÁôº?áÂÆ¢?∂Ë??õÊ???
            actions={
                <Button onClick={() => setShowForm(true)} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    ?∞Â?ÊΩõÂú®ÂÆ¢Êà∂
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
                                placeholder="?úÂ??¨Âè∏?çÁ®±?ÅÁµ±Á∑®Ê??ØÁµ°‰∫?.."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px] bg-white">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="?Ä?ãÁØ©?? />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">?®ÈÉ®?Ä??/SelectItem>
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
                    <CardTitle>ÂÆ¢Êà∂?óË°® ({filteredLeads.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">ËºâÂÖ•‰∏?..</div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            {searchQuery || statusFilter !== 'ALL' ? 'Ê≤íÊ?Á¨¶Â?Ê¢ù‰ª∂?ÑÂÆ¢?? : 'Â∞öÁÑ°ÊΩõÂú®ÂÆ¢Êà∂ÔºåË?ÈªûÊ??åÊñ∞Â¢ûÊ??®ÂÆ¢?∂„ÄçÈ?ÂßãÂª∫Ê™?}
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto rounded-md border bg-white">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="text-left border-b">
                                        <th className="p-3 font-medium">?¨Âè∏?çÁ®±</th>
                                        <th className="p-3 font-medium">Áµ±Á∑®</th>
                                        <th className="p-3 font-medium">?¢Ê•≠??/th>
                                        <th className="p-3 font-medium">?ØÁµ°‰∫?/th>
                                        <th className="p-3 font-medium">?ØÁµ°?πÂ?</th>
                                        <th className="p-3 font-medium">?êË?‰∫∫Êï∏</th>
                                        <th className="p-3 font-medium">?Ä??/th>
                                        <th className="p-3 font-medium">Ë≤†Ë≤¨Ê•≠Â?</th>
                                        <th className="p-3 font-medium">‰∏ãÊ¨°ËøΩËπ§</th>
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
                                            <td className="p-3 text-sm">{lead.assignedUser?.name || '?™Â???}</td>
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
        </StandardPageLayout>
    );
}
