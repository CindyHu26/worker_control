'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Search, FileText } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Button } from '@/components/ui/button';

interface RecruitmentProof {
    id: string;
    receiptNumber: string;
    registerDate: string;
    issueDate: string;
    employer: {
        companyName: string;
    };
    jobCenter: string;
    status: string;
}

export default function RecruitmentProofListPage() {
    const [proofs, setProofs] = useState<RecruitmentProof[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProofs();
    }, []);

    const fetchProofs = async () => {
        try {
            const res = await fetch('/api/recruitment-proofs?valid=false');
            if (res.ok) {
                const data = await res.json();
                setProofs(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <StandardPageLayout
            title="?ãÂÖßÊ±ÇÊ?Ë≠âÊ?ÁÆ°Á?"
            subtitle="ÁÆ°Á??ãÂÖßÊ±ÇÊ??ªË??äË??éÊõ∏ (Domestic Recruitment Certificates)"
            actions={
                <Link href="/recruitment-proofs/new">
                    <Button className="gap-2">
                        <Plus size={16} />
                        ?∞Â?Ë≠âÊ???
                    </Button>
                </Link>
            }
        >
            {/* Table Wrapper for Layout Fix */}
            <div className="w-full overflow-x-auto rounded-md border bg-white shadow-sm mt-6">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">Ë≠âÊ??∏Â???/th>
                            <th className="px-6 py-3">?á‰∏ª?çÁ®±</th>
                            <th className="px-6 py-3">Ê±ÇÊ??ªË???/th>
                            <th className="px-6 py-3">?ºÊ??•Ê?</th>
                            <th className="px-6 py-3">?óÁ?Ê©üÊ?</th>
                            <th className="px-6 py-3">?Ä??/th>
                            <th className="px-6 py-3 text-right">?ç‰?</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {proofs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    Â∞öÁÑ°Ë≥áÊ?
                                </td>
                            </tr>
                        )}
                        {proofs.map(proof => (
                            <tr key={proof.id}>
                                <td className="px-6 py-3 font-medium">{proof.receiptNumber}</td>
                                <td className="px-6 py-3">{proof.employer?.companyName}</td>
                                <td className="px-6 py-3">{format(new Date(proof.registerDate), 'yyyy-MM-dd')}</td>
                                <td className="px-6 py-3">{format(new Date(proof.issueDate), 'yyyy-MM-dd')}</td>
                                <td className="px-6 py-3">{proof.jobCenter}</td>
                                <td className="px-6 py-3">{proof.status}</td>
                                <td className="px-6 py-3 text-right">
                                    <Link href={`/recruitment-proofs/${proof.id}`} className="text-blue-600 hover:underline">
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
