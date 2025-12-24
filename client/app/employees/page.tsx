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

interface Employee {
    id: string;
    code: string;
    fullName: string;
    employeeNumber?: string;
    jobTitle?: string;
    phone?: string;
    email?: string;
    domesticAgency?: {
        agencyNameZh: string;
    };
    isActive: boolean;
}

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/employees?search=${searchTerm}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setEmployees(data.data);
        } catch (error) {
            console.error(error);
            toast.error("載入資料失敗");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchEmployees();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`確定要刪除員工 "${name}" 嗎？`)) return;

        try {
            const res = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            if (!res.ok) throw new Error('Failed to delete');

            toast.success("員工資料刪除成功");
            fetchEmployees();
        } catch (error) {
            console.error(error);
            toast.error("刪除失敗，請稍後再試");
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">員工管理</h1>
                <Link href="/employees/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> 新增員工
                    </Button>
                </Link>
            </div>

            <div className="flex items-center space-x-2 max-w-sm">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="搜尋姓名、代碼、員工編號或信箱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>代碼</TableHead>
                            <TableHead>姓名</TableHead>
                            <TableHead>員工編號</TableHead>
                            <TableHead>職務</TableHead>
                            <TableHead>所屬公司</TableHead>
                            <TableHead>電話</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>狀態</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">載入中...</TableCell>
                            </TableRow>
                        ) : employees.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center h-24">無資料</TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee) => (
                                <TableRow key={employee.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{employee.code}</TableCell>
                                    <TableCell className="font-semibold">{employee.fullName}</TableCell>
                                    <TableCell>{employee.employeeNumber || '-'}</TableCell>
                                    <TableCell>{employee.jobTitle || '-'}</TableCell>
                                    <TableCell>{employee.domesticAgency?.agencyNameZh || '-'}</TableCell>
                                    <TableCell>{employee.phone || '-'}</TableCell>
                                    <TableCell className="text-sm">{employee.email || '-'}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {employee.isActive ? '在職' : '離職'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/employees/${employee.id}`}>
                                                <Button variant="ghost" size="icon" title="編輯">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="刪除"
                                                onClick={() => handleDelete(employee.id, employee.fullName)}
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
            </div>
        </div>
    );
}
