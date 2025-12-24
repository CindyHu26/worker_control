'use client';

import PageContainer from '@/components/layout/PageContainer';
import PartnerAgencyForm from '@/components/partner-agencies/PartnerAgencyForm';

export default function NewPartnerAgencyPage() {
    return (
        <PageContainer
            title="新增國外仲介 (New Agency)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '國外仲介管理', href: '/partner-agencies' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <PartnerAgencyForm />
        </PageContainer>
    );
}
