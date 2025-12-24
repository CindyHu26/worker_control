'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { apiGet, apiDelete } from '@/lib/api';
import TableWrapper from '@/components/ui/TableWrapper';
import PageContainer from '@/components/layout/PageContainer';

interface EmployerCategory {
    id: string;
    code: string;
    nameZh: string;
    nameEn?: string;
    sortOrder: number;
    isActive: boolean;
}

export default function EmployerCategoriesPage() {
    const [categories, setCategories] = useState<EmployerCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/employer-categories?search=${searchTerm}`);
            setCategories(data.data);
        } catch (error) {
            console.error(error);
            toast.error("載入資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchCategories();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除類別 "${name}" 嗎？`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/employer-categories/${id}`);
            toast.success("類別刪除成功。");
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("刪除失敗，請稍後再試。");
        }
    };

    return (
        <PageContainer
            title="雇主類別管理"
            subtitle="管理雇主分類代碼與名稱"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '雇主類別', href: '/employer-categories' },
            ]}
            actions={
                <Link href="/employer-categories/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增類別
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center space-x-2 max-w-sm mb-6">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="搜尋類別..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>代碼</TableHead>
                            <TableHead>中文名稱</TableHead>
                            <TableHead>英文名稱</TableHead>
                            <TableHead>排序</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">無資料</TableCell>
                            </TableRow>
                        ) : (
                            categories.map((cat) => (
                                <TableRow key={cat.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{cat.code}</TableCell>
                                    <TableCell>{cat.nameZh}</TableCell>
                                    <TableCell>{cat.nameEn || '-'}</TableCell>
                                    <TableCell>{cat.sortOrder}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${cat.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {cat.isActive ? '啟用' : '停用'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/employer-categories/${cat.id}`}>
                                                <Button variant="ghost" size="icon" title="編輯">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Delete"
                                                onClick={() => handleDelete(cat.id, cat.nameZh)}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableWrapper>
        </PageContainer>
    );
}
