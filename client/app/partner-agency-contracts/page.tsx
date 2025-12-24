'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageContainer, { TableWrapper } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Contract {
    id: string;
    contractNo: string;
    agency: {
        code: string;
        agencyNameZh: string;
    };
    contractType: string;
    validTo: string;
    status: string;
}

export default function PartnerAgencyContractsPage() {
    const [data, setData] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/partner-agency-contracts?limit=100');
            const result = await res.json();
            setData(result.data);
        } catch (error) {
            toast.error('無法載入合約資');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此合約嗎？')) return;

        try {
            const res = await fetch(`/api/partner-agency-contracts/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('刪除失敗');
            toast.success('刪除成功');
            fetchData();
        } catch (error) {
            toast.error('刪除失敗');
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-TW');
    };

    return (
        <PageContainer
            title="互貿合約管理 (Partner Agency Contracts)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '互貿合約管理' }
            ]}
        >
            <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-500">管理與國外仲介簽署的各類合約</p>
                <Link href="/partner-agency-contracts/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        新增合約
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div>載入中...</div>
            ) : (
                <TableWrapper>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">合約編號</TableHead>
                                <TableHead>國外仲介</TableHead>
                                <TableHead>類型</TableHead>
                                <TableHead>到期日</TableHead>
                                <TableHead>狀態</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        尚無合約資料
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.contractNo}</TableCell>
                                        <TableCell>{item.agency?.code} {item.agency?.agencyNameZh}</TableCell>
                                        <TableCell>{item.contractType}</TableCell>
                                        <TableCell>{formatDate(item.validTo)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                    item.status === 'EXPIRED' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/partner-agency-contracts/${item.id}`}>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableWrapper>
            )}
        </PageContainer>
    );
}
