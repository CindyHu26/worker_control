"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, User, Phone, MapPin } from 'lucide-react';
import EmployerSummaryBoard from '@/components/employers/EmployerSummaryBoard';
import RecruitmentLetterManager from '@/components/employers/RecruitmentLetterManager';
import LaborCountManager from '@/components/employers/LaborCountManager';
import EmployerReadinessDashboard from '@/components/employers/EmployerReadinessDashboard';
import ContractList from '@/components/contracts/ContractList';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
    responsiblePerson?: string;
    phoneNumber?: string;
    address?: string;
    summary?: any;
    _count?: {
        workers: number;
        deployments: number;
    }
}

export default function EmployerDetailPage() {
    const params = useParams();
    const id = params?.id as string;
    const [employer, setEmployer] = useState<Employer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        fetch(`http://localhost:3001/api/employers/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Employer not found');
                return res.json();
            })
            .then(data => {
                setEmployer(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">載入雇主資料中...</div>;
    if (!employer) return <div className="p-8 text-center text-red-500">找不到雇主資料</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Readiness Dashboard */}
                <EmployerReadinessDashboard employerId={id} />

                {/* Header Summary Board */}
                <EmployerSummaryBoard data={employer.summary} />


                {/* Labor Insurance Count Management */}
                <LaborCountManager employerId={id} />

                {/* Recruitment Letter Management Section */}
                <RecruitmentLetterManager employerId={id} />

                {/* Contract Management Section */}
                <ContractList employerId={id} />

                {/* Placeholder for future sections (deployments, etc.) */}
                <div className="mt-6 p-6 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                    此處將顯示更多雇主詳情 (如歷史案件、聯絡紀錄等)
                </div>
            </div>
        </div>
    );
}
