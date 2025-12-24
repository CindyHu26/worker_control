'use client';

import PageContainer from '@/components/layout/PageContainer';
import CountryForm from '@/components/countries/CountryForm';

export default function NewCountryPage() {
    return (
        <PageContainer
            title="新增國別 (New Country)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '國別管理', href: '/countries' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <CountryForm />
        </PageContainer>
    );
}
