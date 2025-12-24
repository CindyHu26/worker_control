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

interface ContractType {
    id: string;
    code: string;
    name: string;
    isControlled: boolean;
    sortOrder: number;
    isActive: boolean;
}

export default function ContractTypesPage() {
    const [data, setData] = useState<ContractType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/contract-types?limit=100');
            const result = await res.json();
            setData(result.data);
        } catch (error) {
            toast.error('無法載入合約類別資料');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此合約類別嗎？')) return;

        try {
            const res = await fetch(`/api/contract-types/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('刪除失敗');
            toast.success('刪除成功');
            fetchData();
        } catch (error) {
            toast.error('刪除失敗');
        }
    };

    return (
        <PageContainer
            title="合約類別管理 (Contract Types)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '合約類別管理' }
            ]}
        >
            <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-500">管理系統中的合約分類與管制設定</p>
                <Link href="/contract-types/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        新增類別
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
                                <TableHead className="w-[100px]">代碼</TableHead>
                                <TableHead>名稱</TableHead>
                                <TableHead className="w-[100px]">管制</TableHead>
                                <TableHead className="w-[100px]">排序</TableHead>
                                <TableHead className="w-[100px]">狀態</TableHead>
                                <TableHead className="text-right">操作</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        尚無資料
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.code}</TableCell>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell>
                                            {item.isControlled && <span className="text-red-600 font-bold">是</span>}
                                        </TableCell>
                                        <TableCell>{item.sortOrder}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.isActive ? '啟用' : '停用'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/contract-types/${item.id}`}>
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
