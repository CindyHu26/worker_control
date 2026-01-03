'use client';

import React, { useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { apiGet, apiDelete } from '@/lib/api';
import TableWrapper from '@/components/ui/TableWrapper';

interface Industry {
    id: string;
    code: string;
    nameZh: string;
}

interface IndustryJobTitle {
    id: string;
    industry: Industry;
    titleZh: string;
    titleEn: string | null;
    isActive: boolean;
}

export default function IndustryJobTitlesPage() {
    const [jobTitles, setJobTitles] = useState<IndustryJobTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchJobTitles = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/industry-job-titles?search=${searchTerm}`);
            setJobTitles(data.data);
        } catch (error) {
            console.error(error);
            toast.error("ËºâÂÖ•Ë≥áÊ?Â§±Ê?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobTitles();
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Á¢∫Â?Ë¶ÅÂà™?§ËÅ∑Á®?"${name}" ?éÔ?`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/industry-job-titles/${id}`);
            toast.success("?∑Á®±?™Èô§?êÂ?");
            fetchJobTitles();
        } catch (error) {
            console.error(error);
            toast.error("?™Èô§Â§±Ê?ÔºåË?Á®çÂ??çË©¶");
        }
    };

    return (
        <StandardPageLayout
            title="Ë°åÊ•≠?∑Á®±ÁÆ°Á?"
            subtitle="ÁÆ°Á??ÑË?Ê•≠Âà•‰∏ãÁ?Ê®ôÊ??∑Á®±"
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/' },
                { label: 'Ë°åÊ•≠?∑Á®±', href: '/industry-job-titles' },
            ]}
            actions={
                <Link href="/industry-job-titles/new">
                    <Button className="flex items-center gap-2">
                        <Plus size={16} />
                        ?∞Â??∑Á®±
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="?úÂ??∑Á®±?ñË?Ê•?.."
                        className="pl-10 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>?ÄÂ±¨Ë?Ê•?/TableHead>
                            <TableHead>?∑Á®± (‰∏≠Ê?)</TableHead>
                            <TableHead>?∑Á®± (?±Ê?)</TableHead>
                            <TableHead>?Ä??/TableHead>
                            <TableHead className="text-right">?ç‰?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    ËºâÂÖ•‰∏?..
                                </TableCell>
                            </TableRow>
                        ) : jobTitles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                    Â∞öÁÑ°Ë≥áÊ?
                                </TableCell>
                            </TableRow>
                        ) : (
                            jobTitles.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <span className="font-medium">{item.industry.code}</span>
                                        <span className="text-gray-500 ml-2">{item.industry.nameZh}</span>
                                    </TableCell>
                                    <TableCell>{item.titleZh}</TableCell>
                                    <TableCell>{item.titleEn}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.isActive ? '?üÁî®' : '?úÁî®'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/industry-job-titles/${item.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                    <Pencil size={16} />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDelete(item.id, item.titleZh)}
                                            >
                                                <Trash2 size={16} />
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
