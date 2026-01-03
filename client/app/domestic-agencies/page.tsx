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
            toast.error("ËºâÂÖ•Ë≥áÊ?Â§±Ê?");
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
        if (!confirm(`Á¢∫Â?Ë¶ÅÂà™?§Â??ß‰ª≤‰ªãÂÖ¨??"${name}" ?éÔ?`)) return;

        try {
            await apiDelete(`http://localhost:3001/api/domestic-agencies/${id}`);
            toast.success("?ãÂÖß‰ª≤‰??¨Âè∏?™Èô§?êÂ?");
            fetchAgencies();
        } catch (error) {
            console.error(error);
            toast.error("?™Èô§Â§±Ê?ÔºåË?Á®çÂ??çË©¶");
        }
    };

    return (
        <StandardPageLayout
            title="?ãÂÖß‰ª≤‰??¨Âè∏ÁÆ°Á?"
            subtitle="ÁÆ°Á??ãÂÖß‰ª≤‰??¨Âè∏Ë≥áÊ?"
            breadcrumbs={[
                { label: 'È¶ñÈ?', href: '/' },
                { label: '?ãÂÖß‰ª≤‰??¨Âè∏', href: '/domestic-agencies' },
            ]}
            actions={
                <Link href="/domestic-agencies/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> ?∞Â??¨Âè∏
                    </Button>
                </Link>
            }
        >
            <div className="flex items-center space-x-2 max-w-sm mb-6">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                    placeholder="?úÂ??¨Âè∏?çÁ®±?Å‰ª£?üÊ?Áµ±Á∑®..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-white"
                />
            </div>

            <TableWrapper>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>‰ª??</TableHead>
                            <TableHead>?¨Âè∏?çÁ®±</TableHead>
                            <TableHead>Á∞°Á®±</TableHead>
                            <TableHead>Áµ±‰?Á∑®Ë?</TableHead>
                            <TableHead>?ªË©±</TableHead>
                            <TableHead>Ë≤†Ë≤¨‰∫?/TableHead>
                            <TableHead>?Ä??/TableHead>
                            <TableHead className="text-right">?ç‰?</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">ËºâÂÖ•‰∏?..</TableCell>
                            </TableRow>
                        ) : agencies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24">?°Ë???/TableCell>
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
                                            {agency.isActive ? '?üÁî®' : '?úÁî®'}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href={`/domestic-agencies/${agency.id}`}>
                                                <Button variant="ghost" size="icon" title="Á∑®ËºØ">
                                                    <Pencil className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            </Link>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="?™Èô§"
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
        </StandardPageLayout>
    );
}
