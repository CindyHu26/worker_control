'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import EmployerForm from '@/components/employers/EmployerForm';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { apiGet, apiPut } from '@/lib/api';
import { toast } from 'sonner';

export default function EditEmployerPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [employer, setEmployer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        apiGet(`/api/employers/${id}`)
            .then(data => {
                setEmployer(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                toast.error('無法載入雇主資料');
                setLoading(false);
            });
    }, [id]);

    const handleSubmit = async (data: any) => {
        try {
            await apiPut(`/api/employers/${id}`, data);
            toast.success('更新成功');
            router.push(`/employers/${id}`);
        } catch (error: any) {
            toast.error(error.message || '更新失敗');
            throw error;
        }
    };

    if (loading) return <div className="p-10 text-center">載入中...</div>;
    if (!employer) return <div className="p-10 text-center">找不到雇主</div>;

    return (
        <StandardPageLayout
            title={`編輯雇主 - ${employer.companyName}`}
            subtitle="完善雇主詳細資料，以利後續申請作業"
            showBack
            breadcrumbs={getEmployerBreadcrumbs()}
        >
            <EmployerForm
                initialData={employer}
                onSubmit={handleSubmit}
                onCancel={() => router.push(`/employers/${id}`)}
                isEdit
            />
        </StandardPageLayout>
    );
}
