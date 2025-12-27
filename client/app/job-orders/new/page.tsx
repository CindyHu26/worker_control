'use client';

import PageContainer from '@/components/layout/PageContainer';
import JobOrderForm from '@/components/job-orders/JobOrderForm';

export default function NewJobOrderPage() {
    return (
        <PageContainer
            title="新增招募訂單"
            subtitle="建立新的職缺需求 (Create Job Order)"
            breadcrumbs={[
                { label: '招募訂單', href: '/job-orders' },
                { label: '新增訂單' },
            ]}
        >
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <JobOrderForm />
            </div>
        </PageContainer>
    );
}
