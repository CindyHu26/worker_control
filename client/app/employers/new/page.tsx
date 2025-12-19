'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/PageContainer';
import EmployerForm from '@/components/employers/EmployerForm';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building, User, Building2 } from 'lucide-react';
import { getEmployerBreadcrumbs } from '@/lib/breadcrumbs';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';
import { INDUSTRIES, IndustryKey } from '@/lib/leadConstants';

const INDUSTRY_CONFIG: Record<string, { icon: any, color: string, description: string }> = {
    MANUFACTURING: { icon: Building, color: 'blue', description: '工廠、製造業雇主\n需填寫工廠登記證號與行業別' },
    HOME_CARE: { icon: User, color: 'green', description: '家庭類類雇主\n需填寫被看護人資料與照護地點' },
    INSTITUTION: { icon: Building2, color: 'purple', description: '安養院、護理之家\n需填寫機構代碼與床位數' },
    CONSTRUCTION: { icon: Building2, color: 'orange', description: '營造工程項目\n需填寫工程地點與期限' },
    FISHERY: { icon: Building, color: 'cyan', description: '海洋漁撈作業' },
    AGRICULTURE: { icon: User, color: 'emerald', description: '農務、畜牧作業' },
    OTHER: { icon: Building2, color: 'slate', description: '其他類別雇主' }
};

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(INDUSTRIES).map(([key, label]) => {
                    const config = INDUSTRY_CONFIG[key] || { icon: Building, color: 'slate', description: '通用雇主類型' };
                    const Icon = config.icon;

                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => onSelect(key)}
                            className="bg-white p-8 rounded-xl shadow-sm border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition group text-left flex flex-col items-start"
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition
                                ${config.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                    config.color === 'green' ? 'bg-green-50 text-green-600' :
                                        config.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                                            config.color === 'orange' ? 'bg-orange-50 text-orange-600' :
                                                config.color === 'cyan' ? 'bg-cyan-50 text-cyan-600' :
                                                    config.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                                                        'bg-slate-50 text-slate-600'
                                }`}
                            >
                                <Icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{label}</h3>
                            <p className="text-gray-500 text-sm whitespace-pre-line">{config.description}</p>
                        </button>
                    );
                })}
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
        try {
            const newEmp = await apiPost('/api/employers', data);

            // Analyze Data Health
            try {
                const health = await apiPost(`/api/compliance/employers/${newEmp.id}/analyze`, {});

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
        } catch (error: any) {
            toast.error(error.message || '系統錯誤');
            throw error;
        }
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
