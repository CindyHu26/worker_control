'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import IndustryJobTitleForm from '@/components/industry-job-titles/IndustryJobTitleForm';

export default function NewIndustryJobTitlePage() {
    return (
        <StandardPageLayout
            title="新增行業職稱"
            subtitle="建立新行業職稱資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '行業名稱', href: '/industry-job-titles' },
                { label: '新增', href: '#' },
            ]}
            showBack={true}
        >
            <IndustryJobTitleForm />
        </StandardPageLayout>
    );
}
