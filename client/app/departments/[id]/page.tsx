'use client';

import React, { useEffect, useState } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import DepartmentForm from '@/components/departments/DepartmentForm';
import { toast } from 'sonner';

export default function EditDepartmentPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/departments/${params.id}`);
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
            title="編輯部門 (Edit Department)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '部門管理', href: '/departments' },
                { label: '編輯' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <DepartmentForm initialData={data} isEdit />
        </StandardPageLayout>
    );
}
