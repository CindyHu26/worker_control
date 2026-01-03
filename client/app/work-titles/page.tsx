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
import { Plus, Pencil, Trash2, Search, Star, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { apiGet, apiDelete } from '@/lib/api';
import TableWrapper from '@/components/ui/TableWrapper';
import StandardPageLayout from '@/components/layout/StandardPageLayout';

interface WorkTitle {
    id: string;
    code: string;
    titleZh: string;
    titleEn: string;
    isIntermediate: boolean;
    isDefault: boolean;
    employmentSecurityFee: number;
    reentrySecurityFee: number;
    sortOrder: number;
    isActive: boolean;
    category?: {
        id: string;
        code: string;
        nameZh: string;
    };
}

export default function WorkTitlesPage() {
    const [workTitles, setWorkTitles] = useState<WorkTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchWorkTitles = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`http://localhost:3001/api/work-titles?search=${searchTerm}`);
            setWorkTitles(data.data);
        } catch (error) {
            console.error(error);
            toast.error("ËºâÂÖ•Ë≥áÊ?Â§±Ê?");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchWorkTitles();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm]);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Á¢∫Â?Ë¶ÅÂà™?§Â∑•Á®?"${name}" ?éÔ?`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/work-titles/${id}`);
            toast.success("Â∑•Á®Æ?™Èô§?êÂ?");
            fetchWorkTitles();
        } catch (error) {
            console.error(error);
            toast.error("?™Èô§Â§±Ê?ÔºåË?Á®çÂ??çË©¶");
        }
    };

    return (
        <StandardPageLayout
            title="Â∑•Á®ÆÁÆ°Á?"
            subtitle="ÁÆ°Á?Â∑•Á®ÆË≥áÊ??áË≤ª?®Ë®≠ÂÆ?(Âæû‰?Â∑•‰??ÖÁõÆ)"
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/' },
                { label: 'Â∑•Á®ÆÁÆ°Á?', href: '/work-titles' },
            ]}
            actions={
                <Link href="/work-titles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> ?∞Â?Â∑•Á®Æ
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center space-x-2 max-w-sm mb-6">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="?úÂ?Â∑•Á®Æ..."
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
                            <TableHead>?ÄÂ±¨Áî≥Ë´ãÈ???/TableHead>
                            <TableHead>Ê®ôÁ±§</TableHead>
                            <TableHead className="text-right">‰∏Ä?¨Â∞±ÂÆâË≤ª</TableHead>
                            <TableHead className="text-right">?çÊ?Â∞±Â?Ë≤?/TableHead>
                            <TableHead>?Ä??/TableHead>
                            <TableHead className="text-right">?ç‰?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">ËºâÂÖ•‰∏?..</TableCell>
                            </TableRow>
                        ) : workTitles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">?°Ë???/TableCell>
                            </TableRow>
                        ) : (
                            workTitles.map((wt) => (
                                <TableRow key={wt.id} className="group hover:bg-gray-50">
                                    <TableCell className="font-medium">{wt.code}</TableCell>
                                    <TableCell>{wt.titleZh}</TableCell>
                                    <TableCell>
                                        {wt.category ? (
                                            <span className="text-blue-600">{wt.category.nameZh}</span>
                                        ) : (
                                            <span className="text-gray-400">?öÁî®</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            {wt.isDefault && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    <Star className="w-3 h-3 mr-1" /> ?êË®≠
                                                </span>
                                            )}
                                            {wt.isIntermediate && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                    <Zap className="w-3 h-3 mr-1" /> ‰∏≠È?
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{wt.employmentSecurityFee.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{wt.reentrySecurityFee.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs ${wt.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {wt.isActive ? '?üÁî®' : '?úÁî®'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/work-titles/${wt.id}`}>
                                                <Button variant="ghost" size="icon" title="Á∑®ËºØ">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="?™Èô§"
                                                onClick={() => handleDelete(wt.id, wt.titleZh)}
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
