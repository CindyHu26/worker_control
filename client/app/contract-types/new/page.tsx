'use client';

import PageContainer from '@/components/layout/PageContainer';
import ContractTypeForm from '@/components/contract-types/ContractTypeForm';

export default function NewContractTypePage() {
    return (
        <PageContainer
            title="新增合約類別 (New Contract Type)"
            breadcrumbs={[
                { label: '首頁', href: '/' },
                { label: '合約類別管理', href: '/contract-types' },
                { label: '新增' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <ContractTypeForm />
        </PageContainer>
    );
}
