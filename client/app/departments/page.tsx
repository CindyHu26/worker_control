'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StandardPageLayout, { TableWrapper } from '@/components/layout/StandardPageLayout';
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

interface Department {
    id: string;
    code: string;
    nameZh: string;
    nameEn: string;
    sortOrder: number;
    isActive: boolean;
}

export default function DepartmentsPage() {
    const [data, setData] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/departments?limit=100'); // Fetch all for now
            const result = await res.json();
            setData(result.data);
        } catch (error) {
            toast.error('無法載入部門資料');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除此部門嗎？')) return;

        try {
            const res = await fetch(`/api/departments/${id}`, {
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
        <StandardPageLayout
            title="部門管理 (Departments)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '部門管理' }
            ]}
        >
            <div className="mb-6 flex justify-between items-center">
                <p className="text-gray-500">管理公司內部部門與組織架構</p>
                <Link href="/departments/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        新增部門
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
                                <TableHead>名稱 (中文)</TableHead>
                                <TableHead>名稱 (英文)</TableHead>
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
                                        <TableCell>{item.nameZh}</TableCell>
                                        <TableCell>{item.nameEn}</TableCell>
                                        <TableCell>{item.sortOrder}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {item.isActive ? '啟用' : '停用'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/departments/${item.id}`}>
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
        </StandardPageLayout>
    );
}
