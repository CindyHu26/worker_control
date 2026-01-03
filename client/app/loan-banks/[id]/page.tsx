'use client';

import React, { useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import LoanBankForm from '@/components/loan-banks/LoanBankForm';
import { toast } from 'sonner';

export default function EditLoanBankPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/loan-banks/${params.id}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const result = await res.json();
                setData(result);
            } catch (error) {
                toast.error('無法載入資料');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) return <div>載入中...</div>;
    if (!data) return <div>找不到資料</div>;

    return (
        <StandardPageLayout
            title="編輯貸款銀行 (Edit Loan Bank)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '貸款銀行管理', href: '/loan-banks' },
                { label: '編輯' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <LoanBankForm initialData={data} isEdit />
        </StandardPageLayout>
    );
}
