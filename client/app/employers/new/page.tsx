"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import EmployerForm from '@/components/employers/EmployerForm';

export default function NewEmployerPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const res = await fetch('http://localhost:3001/api/employers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || '系統錯誤');
        }

        const newEmp = await res.json();

        // Analyze Data Health
        try {
            const healthRes = await fetch(`http://localhost:3001/api/compliance/employers/${newEmp.id}/analyze`, { method: 'POST' });
            const health = await healthRes.json();

            if (!health.isReady) {
                alert(`系統成功儲存！但請注意以下缺漏 (System Saved with Warnings):\n\n${health.alerts.join('\n')}`);
            } else {
                alert('新增成功 (Saved Successfully)');
            }
        } catch (e) {
            console.error('Analysis failed', e);
            alert('新增成功 (Saved Successfully)');
        }

        router.push(`/employers/${newEmp.id}`);
        router.refresh();
    };

    return <EmployerForm onSubmit={handleSubmit} />;
}
