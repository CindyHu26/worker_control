'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Upload, Search } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';

interface Candidate {
    id: string;
    nameZh: string;
    nameEn?: string;
    passportNo: string;
    nationality: string;
    status: string;
    createdAt: string;
}

const statusLabels: Record<string, string> = {
    NEW: '?∞Ë???,
    INTERVIEW: '?¢Ë©¶‰∏?,
    SELECTED: 'Â∑≤È???,
    REJECTED: '?™È???,
    WITHDRAWN: 'Â∑≤Êí§??,
};

export default function CandidateListPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchCandidates();
    }, [statusFilter]);

    const fetchCandidates = async () => {
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await fetch(`/api/candidates?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCandidates(data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchCandidates();
    };

    return (
        <StandardPageLayout
            title="?ôÈÅ∏‰∫∫ÁÆ°??
            subtitle="?ãÂ?‰∫∫Ê?Â±•Ê≠∑Â∫?(Candidate Pool)"
            actions={
                <div className="flex gap-2">
                    <Link href="/candidates/import">
                        <Button variant="outline" className="gap-2">
                            <Upload size={16} />
                            ?ØÂÖ• Excel
                        </Button>
                    </Link>
                    <Link href="/candidates/new">
                        <Button className="gap-2">
                            <Plus size={16} />
                            ?∞Â??ôÈÅ∏‰∫?
                        </Button>
                    </Link>
                </div>
            }
        >
            {/* Filters */}
            <div className="mb-4 flex gap-3">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        placeholder="?úÂ?ÂßìÂ??ñË≠∑?ßË?Á¢?.."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-3 py-2 border rounded-md bg-white"
                    />
                    <Button onClick={handleSearch} className="gap-2">
                        <Search size={16} />
                        ?úÂ?
                    </Button>
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                >
                    <option value="">?®ÈÉ®?Ä??/option>
                    <option value="NEW">?∞Ë???/option>
                    <option value="INTERVIEW">?¢Ë©¶‰∏?/option>
                    <option value="SELECTED">Â∑≤È???/option>
                    <option value="REJECTED">?™È???/option>
                </select>
            </div>

            {/* Table Wrapper */}
            <div className="w-full overflow-x-auto rounded-md border bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">‰∏≠Ê?ÂßìÂ?</th>
                            <th className="px-6 py-3">?±Ê?ÂßìÂ?</th>
                            <th className="px-6 py-3">Ë≠∑ÁÖß?üÁ¢º</th>
                            <th className="px-6 py-3">?ãÁ?</th>
                            <th className="px-6 py-3">?Ä??/th>
                            <th className="px-6 py-3">?ØÂÖ•?•Ê?</th>
                            <th className="px-6 py-3 text-right">?ç‰?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {candidates.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    Â∞öÁÑ°?ôÈÅ∏‰∫∫Ë???
                                </td>
                            </tr>
                        )}
                        {candidates.map((candidate) => (
                            <tr key={candidate.id} className="hover:bg-slate-50">
                                <td className="px-6 py-3 font-medium">{candidate.nameZh}</td>
                                <td className="px-6 py-3 text-slate-600">{candidate.nameEn || '-'}</td>
                                <td className="px-6 py-3 font-mono text-xs">{candidate.passportNo}</td>
                                <td className="px-6 py-3">{candidate.nationality}</td>
                                <td className="px-6 py-3">
                                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                        {statusLabels[candidate.status] || candidate.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-slate-600">
                                    {new Date(candidate.createdAt).toLocaleDateString('zh-TW')}
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <Link
                                        href={`/candidates/${candidate.id}`}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Ê™¢Ë?
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </StandardPageLayout>
    );
}
