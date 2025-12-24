'use client';

import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import IndustryJobTitleForm from '@/components/industry-job-titles/IndustryJobTitleForm';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';

export default function EditIndustryJobTitlePage() {
    const params = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await apiGet(`http://localhost:3001/api/industry-job-titles/${params.id}`);
                setData(result);
            } catch (error) {
                console.error(error);
                toast.error("無法載入資料");
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchData();
        }
    }, [params.id]);

    if (loading) {
        return (
            <PageContainer title="載入中..." showBack={true}>
                <div className="p-8 text-center text-gray-500">資料載入中...</div>
            </PageContainer>
        );
    }

    if (!data) {
        return (
            <PageContainer title="找不到資料" showBack={true}>
                <div className="p-8 text-center text-red-500">無法找到該筆資料</div>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title="編輯行業職稱"
            subtitle="修改現有的行業職稱資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '行業職稱', href: '/industry-job-titles' },
                { label: '編輯', href: '#' },
            ]}
            showBack={true}
        >
            <IndustryJobTitleForm initialData={data} isEdit={true} />
        </PageContainer>
    );
}
