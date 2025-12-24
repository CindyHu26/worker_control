'use client';

import PageContainer from '@/components/layout/PageContainer';
import LoanBankForm from '@/components/loan-banks/LoanBankForm';

export default function NewLoanBankPage() {
    return (
        <PageContainer
            title="新增貸款銀行 (New Loan Bank)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '貸款銀行管理', href: '/loan-banks' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <LoanBankForm />
        </PageContainer>
    );
}
