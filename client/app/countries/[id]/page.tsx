'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import CountryForm from '@/components/countries/CountryForm';
import { toast } from 'sonner';

export default function EditCountryPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/countries/${params.id}`);
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
        <PageContainer
            title="編輯國別 (Edit Country)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '國別管理', href: '/countries' },
                { label: '編輯' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <CountryForm initialData={data} isEdit />
        </PageContainer>
    );
}
