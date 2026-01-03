'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import IndustryJobTitleForm from '@/components/industry-job-titles/IndustryJobTitleForm';

export default function NewIndustryJobTitlePage() {
    return (
        <StandardPageLayout
            title="?°å?è¡Œæ¥­?·ç¨±"
            subtitle="å»ºç??°ç?è¡Œæ¥­?·ç¨±è³‡æ?"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: 'è¡Œæ¥­?·ç¨±', href: '/industry-job-titles' },
                { label: '?°å?', href: '#' },
            ]}
            showBack={true}
        >
            <IndustryJobTitleForm />
        </StandardPageLayout>
    );
}
