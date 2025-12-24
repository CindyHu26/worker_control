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

interface DomesticAgency {
    id: string;
    code: string;
    agencyNameZh: string;
    agencyNameShort?: string;
    taxId?: string;
    phone?: string;
    representativeName?: string;
    isActive: boolean;
}

export default function DomesticAgenciesPage() {
    const [agencies, setAgencies] = useState<DomesticAgency[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchAgencies = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/domestic-agencies?search=${searchTerm}`);
            setAgencies(data.data);
        } catch (error) {
            console.error(error);
            toast.error("載入資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchAgencies();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除國內仲介公司 "${name}" 嗎？`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/domestic-agencies/${id}`);
            toast.success("國內仲介公司刪除成功");
            fetchAgencies();
        } catch (error) {
            console.error(error);
            toast.error("刪除失敗，請稍後再試");
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">國內仲介公司管理</h1>
                <Link href="/domestic-agencies/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增公司
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="搜尋公司名稱、代號或統編..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>代號</TableHead>
                            <TableHead>公司名稱</TableHead>
                            <TableHead>簡稱</TableHead>
                            <TableHead>統一編號</TableHead>
                            <TableHead>電話</TableHead>
                            <TableHead>負責人</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : agencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">無資料</TableCell>
                            </TableRow>
                        ) : (
                            agencies.map((agency) => (
                                <TableRow key={agency.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{agency.code}</TableCell>
                                    <TableCell className="font-semibold">{agency.agencyNameZh}</TableCell>
                                    <TableCell>{agency.agencyNameShort || '-'}</TableCell>
                                    <TableCell>{agency.taxId || '-'}</TableCell>
                                    <TableCell>{agency.phone || '-'}</TableCell>
                                    <TableCell>{agency.representativeName || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${agency.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {agency.isActive ? '啟用' : '停用'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/domestic-agencies/${agency.id}`}>
                                                <Button variant="ghost" size="icon" title="編輯">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="刪除"
                                                onClick={() => handleDelete(agency.id, agency.agencyNameZh)}
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
        </div>
    );
}
