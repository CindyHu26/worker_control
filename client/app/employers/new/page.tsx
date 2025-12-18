'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import EmployerForm from '@/components/employers/EmployerForm';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building, User, Building2 } from 'lucide-react';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';

/**
 * Category Selection Modal Component
 */
function CategorySelectionWizard({ onSelect }: { onSelect: (category: string) => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">請選擇雇主類型</h2>
                <p className="text-gray-600">不同類型的雇主需要填寫不同的資料</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Manufacturing */}
                <button
                    type="button"
                    onClick={() => onSelect('MANUFACTURING')}
                    className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition group text-left"
                >
                    <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition">
                        <Building size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">製造業</h3>
                    <p className="text-gray-600 text-sm">工廠、製造業雇主<br />需填寫工廠登記證號與行業別</p>
                </button>

                {/* Home Care */}
                <button
                    type="button"
                    onClick={() => onSelect('HOME_CARE')}
                    className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:border-green-500 hover:shadow-lg transition group text-left"
                >
                    <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition">
                        <User size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">家庭看護</h3>
                    <p className="text-gray-600 text-sm">家庭類雇主<br />需填寫被看護人資料與照護地點</p>
                </button>

                {/* Institution */}
                <button
                    type="button"
                    onClick={() => onSelect('INSTITUTION')}
                    className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:border-purple-500 hover:shadow-lg transition group text-left"
                >
                    <div className="w-16 h-16 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition">
                        <Building2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">養護機構</h3>
                    <p className="text-gray-600 text-sm">安養院、護理之家<br />需填寫機構代碼與床位數</p>
                </button>
            </div>
        </div>
    );
}

export default function NewEmployerPage() {
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
    };

    const handleSubmit = async (data: any) => {
        const res = await fetch('/api/employers', {
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
            const healthRes = await fetch(`/api/compliance/employers/${newEmp.id}/analyze`, {
                method: 'POST'
            });
            const health = await healthRes.json();

            if (!health.isReady) {
                toast.warning(`系統成功儲存！但請注意以下缺漏：\n${health.alerts.join('\n')}`);
            } else {
                toast.success('新增成功');
            }
        } catch (e) {
            console.error('Analysis failed', e);
            toast.success('新增成功');
        }

        router.push(`/employers/${newEmp.id}`);
    };

    const handleCancel = () => {
        if (selectedCategory) {
            setSelectedCategory(null);
        } else {
            router.push('/employers');
        }
    };

    return (
        <PageContainer
            title={selectedCategory ? "新增雇主" : "選擇雇主類型"}
            subtitle={selectedCategory ? "請填寫完整的雇主資訊" : undefined}
            showBack
            breadcrumbs={getEmployerBreadcrumbs()}
            actions={
                selectedCategory && (
                    <Button variant="outline" onClick={() => setSelectedCategory(null)}>
                        重新選擇類型
                    </Button>
                )
            }
        >
            {!selectedCategory ? (
                <CategorySelectionWizard onSelect={handleCategorySelect} />
            ) : (
                <EmployerForm
                    initialData={{ category: selectedCategory }}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />
            )}
        </PageContainer>
    );
}
