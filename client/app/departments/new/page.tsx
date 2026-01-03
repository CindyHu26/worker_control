'use client';

import StandardPageLayout from '@/components/layout/StandardPageLayout';
import DepartmentForm from '@/components/departments/DepartmentForm';

export default function NewDepartmentPage() {
    return (
        <StandardPageLayout
            title="?°å??¨é? (New Department)"
            breadcrumbs={[
                { label: 'é¦–é?', href: '/' },
                { label: '?¨é?ç®¡ç?', href: '/departments' },
                { label: '?°å?' }
            ]}
            showBack
            maxWidth="2xl"
        >
            <DepartmentForm />
        </StandardPageLayout>
    );
}
