"use client";

import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import BankForm from '@/components/bank/BankForm';

export default function CreateBankPage() {
    return (
        <PageContainer
            title="新增銀行 (Create Bank)"
            subtitle="建立新的銀行資料"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '銀行管理', href: '/banks' },
                { label: '新增', href: '#' },
            ]}
            showBack={true}
            maxWidth="xl" // Limit width for form readability
            card={false} // BankForm has its own card
        >
            <BankForm />
        </PageContainer>
    );
}
