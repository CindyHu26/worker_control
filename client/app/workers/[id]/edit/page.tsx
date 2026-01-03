'use client';

import { useState, useEffect } from 'react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import WorkerForm from '@/components/workers/WorkerForm';
import { useRouter } from 'next/navigation';
import { getWorkerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';

export default function EditWorkerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [worker, setWorker] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorker = async () => {
            try {
                const res = await fetch(`/api/workers/${params.id}`);
                if (!res.ok) throw new Error('Worker not found');
                const data = await res.json();
                setWorker(data);
            } catch (err: any) {
                toast.error(err.message || '載入失敗');
                router.push('/workers');
            } finally {
                setLoading(false);
            }
        };

        fetchWorker();
    }, [params.id, router]);

    const handleSubmit = async (data: any) => {
        const res = await fetch(`/api/workers/${params.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '更新失敗');
        }

        toast.success('外勞資料更新成功');
        router.push(`/workers/${params.id}`);
    };

    const handleCancel = () => {
        router.push(`/workers/${params.id}`);
    };

    if (loading) {
        return (
            <StandardPageLayout title="載入中...">
                <div className="text-center py-12 text-gray-500">載入外勞資料中...</div>
            </StandardPageLayout>
        );
    }

    if (!worker) {
        return (
            <StandardPageLayout title="錯誤">
                <div className="text-center py-12 text-red-600">找不到該外勞資料</div>
            </StandardPageLayout>
        );
    }

    return (
        <StandardPageLayout
            title={`編輯外勞：${worker.englishName || worker.chineseName || '未命名'}`}
            showBack
            breadcrumbs={getWorkerBreadcrumbs(worker.id, worker.englishName || worker.chineseName)}
        >
            <WorkerForm
                initialData={{
                    englishName: worker.englishName || '',
                    chineseName: worker.chineseName || '',
                    nationality: worker.nationality || 'Indonesia',
                    dob: worker.dob ? worker.dob.split('T')[0] : '',
                    gender: worker.gender || 'Male',
                    mobilePhone: worker.mobilePhone || '',
                    foreignAddress: worker.foreignAddress || '',
                    taiwanAddress: worker.taiwanAddress || '',
                    passportNo: worker.passportNo || '',
                    passportIssueDate: worker.passportIssueDate ? worker.passportIssueDate.split('T')[0] : '',
                    passportExpiryDate: worker.passportExpiryDate ? worker.passportExpiryDate.split('T')[0] : '',
                    employerId: worker.currentEmployerId || '',
                    deploymentDate: worker.deploymentDate ? worker.deploymentDate.split('T')[0] : '',
                    contractEndDate: worker.contractEndDate ? worker.contractEndDate.split('T')[0] : '',
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
            />
        </StandardPageLayout>
    );
}
