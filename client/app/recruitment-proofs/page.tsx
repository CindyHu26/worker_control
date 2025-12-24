'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Search, FileText } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
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
        <PageContainer
            title="國內求才證明管理"
            subtitle="管理國內求才登記及證明書 (Domestic Recruitment Certificates)"
            actions={
                <Link href="/recruitment-proofs/new">
                    <Button className="gap-2">
                        <Plus size={16} />
                        新增證明書
                    </Button>
                </Link>
            }
        >
            {/* Table Wrapper for Layout Fix */}
            <div className="w-full overflow-x-auto rounded-md border bg-white shadow-sm mt-6">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                        <tr>
                            <th className="px-6 py-3">證明書序號</th>
                            <th className="px-6 py-3">雇主名稱</th>
                            <th className="px-6 py-3">求才登記日</th>
                            <th className="px-6 py-3">發文日期</th>
                            <th className="px-6 py-3">受理機構</th>
                            <th className="px-6 py-3">狀態</th>
                            <th className="px-6 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {proofs.length === 0 && !loading && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                                    尚無資料
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
                                        檢視
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </PageContainer>
    );
}
