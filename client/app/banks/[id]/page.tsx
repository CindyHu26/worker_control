"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import BankForm from '@/components/bank/BankForm';
import { apiGet } from '@/lib/api';
import { BankResponse } from '@worker-control/shared';
import { Loader2 } from 'lucide-react';

export default function EditBankPage() {
    const params = useParams();
    const id = params.id as string;
    const [bank, setBank] = useState<BankResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchBank = async () => {
            try {
                const data = await apiGet<BankResponse>(`/api/banks/${id}`);
                setBank(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load bank');
            } finally {
                setLoading(false);
            }
        };
        fetchBank();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <StandardPageLayout title="Error" showBack>
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                    {error}
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title="編輯銀行 (Edit Bank)"
            subtitle={`${bank?.bankName} (${bank?.code})`}
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '銀行管理', href: '/banks' },
                { label: '編輯', href: '#' },
            ]}
            showBack={true}
            maxWidth="xl"
            card={false}
        >
            {bank && <BankForm initialData={bank} isEdit />}
        </StandardPageLayout>
    );
}
