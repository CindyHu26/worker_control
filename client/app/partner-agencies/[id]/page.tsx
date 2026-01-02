'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import PartnerAgencyForm from '@/components/partner-agencies/PartnerAgencyForm';
import { toast } from 'sonner';
import { apiGet } from '@/lib/api';

export default function EditPartnerAgencyPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);



    // ...

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await apiGet<any>(`/api/partner-agencies/${params.id}`);
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
            title="編輯國外仲介 (Edit Agency)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '國外仲介管理', href: '/partner-agencies' },
                { label: '編輯' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyForm initialData={data} isEdit />
        </PageContainer>
    );
}
