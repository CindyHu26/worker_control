'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import JobOrderForm from '@/components/job-orders/JobOrderForm';

export default function NewJobOrderPage() {
    return (
        <StandardPageLayout
            title="新增求才訂單"
            subtitle="建立新的人力需求訂單(Create Job Order)"
            breadcrumbs={[
                { label: '求才訂單', href: '/job-orders' },
                { label: '新增訂單' },
            ]}
        >
            <div className="bg-white rounded-lg border shadow-sm p-6">
                <JobOrderForm />
            </div>
        </StandardPageLayout>
    );
}
