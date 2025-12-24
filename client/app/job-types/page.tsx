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

interface JobType {
    id: string;
    code: string;
    titleZh: string;
    titleEn: string;
    employmentSecurityFee: number;
    reentrySecurityFee: number;
    sortOrder: number;
    isActive: boolean;
}

export default function JobTypesPage() {
    const [jobTypes, setJobTypes] = useState<JobType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchJobTypes = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/job-types?search=${searchTerm}`);
            setJobTypes(data.data);
        } catch (error) {
            console.error(error);
            toast.error("載入資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchJobTypes();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除工種 "${name}" 嗎？`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/job-types/${id}`);
            toast.success("工種刪除成功");
            fetchJobTypes();
        } catch (error) {
            console.error(error);
            toast.error("刪除失敗，請稍後再試");
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">工種管理</h1>
                <Link href="/job-types/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增工種
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="搜尋工種..."
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
                            <TableHead className="text-right">一般就安費</TableHead>
                            <TableHead className="text-right">重投就安費</TableHead>
                            <TableHead>排序</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : jobTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">無資料</TableCell>
                            </TableRow>
                        ) : (
                            jobTypes.map((jobType) => (
                                <TableRow key={jobType.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{jobType.code}</TableCell>
                                    <TableCell>{jobType.titleZh}</TableCell>
                                    <TableCell>{jobType.titleEn}</TableCell>
                                    <TableCell className="text-right">{jobType.employmentSecurityFee.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{jobType.reentrySecurityFee.toLocaleString()}</TableCell>
                                    <TableCell>{jobType.sortOrder}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${jobType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {jobType.isActive ? '啟用' : '停用'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/job-types/${jobType.id}`}>
                                                <Button variant="ghost" size="icon" title="編輯">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="刪除"
                                                onClick={() => handleDelete(jobType.id, jobType.titleZh)}
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
