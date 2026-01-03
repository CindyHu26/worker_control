'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import JobOrderForm from '@/components/job-orders/JobOrderForm';

export default function EditJobOrderPage() {
    const params = useParams();
    const [jobOrder, setJobOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        if (id) {
            fetchJobOrder();
        }
    }, [id]);

    const fetchJobOrder = async () => {
        try {
            const res = await fetch(`/api/job-orders/${id}`);
            if (res.ok) {
                const data = await res.json();
                setJobOrder(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <StandardPageLayout title="載入中...">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            </StandardPageLayout>
        );
    }

    if (!jobOrder) {
        return (
            <StandardPageLayout title="找不到招募訂單">
                <div className="text-center py-20 text-slate-500">
                    招募訂單不存在或已刪除
                </div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title={`編輯：${jobOrder.title}`}
            subtitle="修改招募訂單資訊 (Edit Job Order)"
            breadcrumbs={[
                { label: '招募訂單', href: '/job-orders' },
                { label: jobOrder.title, href: `/job-orders/${id}` },
                { label: '編輯' },
            ]}
        >
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <JobOrderForm initialData={jobOrder} isEdit />
            </div>
        </StandardPageLayout>
    );
}
