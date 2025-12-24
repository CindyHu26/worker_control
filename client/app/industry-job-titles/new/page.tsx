'use client';

import PageContainer from '@/components/layout/PageContainer';
import IndustryJobTitleForm from '@/components/industry-job-titles/IndustryJobTitleForm';

export default function NewIndustryJobTitlePage() {
    return (
        <PageContainer
            title="新增行業職稱"
            subtitle="建立新的行業職稱資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '行業職稱', href: '/industry-job-titles' },
                { label: '新增', href: '#' },
            ]}
            showBack={true}
        >
            <IndustryJobTitleForm />
        </PageContainer>
    );
}
