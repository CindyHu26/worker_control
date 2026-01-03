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
            toast.error("ËºâÂÖ•Ë≥áÊ?Â§±Ê?");
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
        if (!confirm(`Á¢∫Â?Ë¶ÅÂà™?§È???"${name}" ?éÔ?`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/employer-categories/${id}`);
            toast.success("È°ûÂà•?™Èô§?êÂ???);
            fetchCategories();
        } catch (error) {
            console.error(error);
            toast.error("?™Èô§Â§±Ê?ÔºåË?Á®çÂ??çË©¶??);
        }
    };

    return (
        <StandardPageLayout
            title="?á‰∏ªÈ°ûÂà•ÁÆ°Á?"
            subtitle="ÁÆ°Á??á‰∏ª?ÜÈ?‰ª?¢º?áÂ?Á®?
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/' },
                { label: '?á‰∏ªÈ°ûÂà•', href: '/employer-categories' },
            ]}
            actions={
                <Link href="/employer-categories/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> ?∞Â?È°ûÂà•
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center space-x-2 max-w-sm mb-6">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="?úÂ?È°ûÂà•..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>‰ª?¢º</TableHead>
                            <TableHead>‰∏≠Ê??çÁ®±</TableHead>
                            <TableHead>?±Ê??çÁ®±</TableHead>
                            <TableHead>?íÂ?</TableHead>
                            <TableHead>?Ä??/TableHead>
                            <TableHead className="text-right">?ç‰?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">ËºâÂÖ•‰∏?..</TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">?°Ë???/TableCell>
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
                                            {cat.isActive ? '?üÁî®' : '?úÁî®'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/employer-categories/${cat.id}`}>
                                                <Button variant="ghost" size="icon" title="Á∑®ËºØ">
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
        </StandardPageLayout>
    );
}
