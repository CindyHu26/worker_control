'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import WorkerForm from '@/components/workers/WorkerForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function NewWorkerPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const res = await fetch('/api/workers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '移工建立失敗');
        }

        const worker = await res.json();
        toast.success('移工建立成功');
        router.push(`/workers/${worker.id}`);
    };

    const handleCancel = () => {
        router.push('/workers');
    };

    return (
        <StandardPageLayout
            title="新增移工"
            subtitle="請填寫移工資料"
            showBack
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '移工管理', href: '/workers' },
                { label: '新增移工' }
            ]}
        >
            <WorkerForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </StandardPageLayout>
    );
}
