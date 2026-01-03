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
            throw new Error(error.error || 'å»ºç?å¤±æ?');
        }

        const worker = await res.json();
        toast.success('å¤–å?å»ºæ??å?');
        router.push(`/workers/${worker.id}`);
    };

    const handleCancel = () => {
        router.push('/workers');
    };

    return (
        <StandardPageLayout
            title="?°å?ç§»å·¥"
            subtitle="å»ºç??°ç?å¤–ç??å·¥æª”æ??–æ–°å¢æ´¾?????
            showBack
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: 'å¤–å?ç®¡ç?', href: '/workers' },
                { label: '?°å?ç§»å·¥' }
            ]}
        >
            <WorkerForm onSubmit={handleSubmit} onCancel={handleCancel} />
        </StandardPageLayout>
    );
}
