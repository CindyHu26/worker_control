"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, User, Phone, MapPin } from 'lucide-react';
import RecruitmentLetterManager from '@/components/employers/RecruitmentLetterManager';
import EmployerReadinessDashboard from '@/components/employers/EmployerReadinessDashboard';

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
    responsiblePerson?: string;
    phoneNumber?: string;
    address?: string;
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

                {/* Header Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="md:flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <Building2 className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{employer.companyName}</h1>
                                    <p className="text-gray-500 text-sm">統編 (Tax ID): {employer.taxId}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>負責人: {employer.responsiblePerson || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>連絡電話: {employer.phoneNumber || '-'}</span>
                                </div>
                                <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="w-4 h-4 text-gray-400" />
                                    <span>地址: {employer.address || '-'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 md:mt-0 flex gap-4">
                            <div className="text-center px-4 py-2 bg-gray-50 rounded border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">目前移工</p>
                                <p className="text-2xl font-bold text-gray-800">{employer._count?.workers || 0}</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-gray-50 rounded border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">部署紀錄</p>
                                <p className="text-2xl font-bold text-gray-800">{employer._count?.deployments || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recruitment Letter Management Section */}
                <RecruitmentLetterManager employerId={id} />

                {/* Placeholder for future sections (deployments, etc.) */}
                <div className="mt-6 p-6 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                    此處將顯示更多雇主詳情 (如歷史案件、聯絡紀錄等)
                </div>
            </div>
        </div>
    );
}
