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
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface Industry {
    id: string;
    code: string;
    category?: string;
    nameZh: string;
    nameEn?: string;
    isOpen: boolean;
}

export default function IndustriesPage() {
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchIndustries = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/industries?search=${searchTerm}`);
            setIndustries(data.data);
        } catch (error) {
            console.error(error);
            toast.error("載入資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchIndustries();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除行業別 "${name}" 嗎？`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/industries/${id}`);
            toast.success("行業別刪除成功");
            fetchIndustries();
        } catch (error) {
            console.error(error);
            toast.error("刪除失敗，請稍後再試");
        }
    };

    return (
        <StandardPageLayout
            title="行業別管理"
            subtitle="管理行業別代碼與名稱"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '行業別管理', href: '/industries' },
            ]}
            actions={
                <Link href="/industries/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增行業別
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center space-x-2 max-w-sm mb-6">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="搜尋行業別..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>行業代碼</TableHead>
                            <TableHead>行業類別</TableHead>
                            <TableHead>中文名稱</TableHead>
                            <TableHead>英文名稱</TableHead>
                            <TableHead>開放狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : industries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">無資料</TableCell>
                            </TableRow>
                        ) : (
                            industries.map((industry) => (
                                <TableRow key={industry.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{industry.code}</TableCell>
                                    <TableCell>{industry.category || '-'}</TableCell>
                                    <TableCell>{industry.nameZh}</TableCell>
                                    <TableCell>{industry.nameEn || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${industry.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {industry.isOpen ? '開放' : '不開放'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/industries/${industry.id}`}>
                                                <Button variant="ghost" size="icon" title="編輯">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="刪除"
                                                onClick={() => handleDelete(industry.id, industry.nameZh)}
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
        </StandardPageLayout>
    );
}
