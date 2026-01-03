'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import CountryForm from '@/components/countries/CountryForm';

export default function NewCountryPage() {
    return (
        <StandardPageLayout
            title="新增國別 (New Country)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '類別管理', href: '/countries' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <CountryForm />
        </StandardPageLayout>
    );
}
