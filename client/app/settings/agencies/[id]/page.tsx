"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AgencyForm from '@/components/agencies/AgencyForm';
import { Loader2 } from 'lucide-react';

interface AgencyData {
    id: string;
    name: string;
    licenseNo: string;
    taxId: string;
    responsiblePerson: string;
    address?: string;
    phone?: string;
    fax?: string;
    email?: string;
    isDefault: boolean;
    agencyCode?: string;
    licenseExpiryDate?: string;
    nameEn?: string;
    addressEn?: string;
    representativeEn?: string;
    bankName?: string;
    bankCode?: string;
    bankBranch?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    sealLargeUrl?: string;
    sealSmallUrl?: string;
    logoUrl?: string;
}

export default function EditAgencyPage() {
    const params = useParams();
    const id = params.id as string;
    const [agency, setAgency] = useState<AgencyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAgency = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
                const res = await fetch(`${apiUrl}/settings/agency-companies/${id}`);

                if (!res.ok) {
                    throw new Error('Failed to fetch agency');
                }

                const data = await res.json();
                setAgency(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchAgency();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                    <p className="text-gray-500">載入中...</p>
                </div>
            </div>
        );
    }

    if (error || !agency) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 text-lg">{error || '找不到該公司資料'}</p>
                </div>
            </div>
        );
    }

    return <AgencyForm mode="edit" initialData={agency} />;
}
