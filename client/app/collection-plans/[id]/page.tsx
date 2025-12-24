'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import CollectionPlanForm from '@/components/collection-plan/CollectionPlanForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function EditCollectionPlanPage({ params }: PageProps) {
    const { id } = use(params);
    const [planData, setPlanData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const response = await fetch(`/api/collection-plans/${id}`);
                if (!response.ok) {
                    if (response.status === 404) {
                        setError('找不到此收款計劃');
                    } else {
                        throw new Error('Failed to fetch');
                    }
                    return;
                }
                const data = await response.json();
                setPlanData(data);
            } catch (err) {
                console.error('Error fetching collection plan:', err);
                setError('載入失敗，請稍後再試');
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="md:pl-64 lg:pl-72">
                    <div className="p-4 md:p-6 lg:p-8 pr-4 md:pr-6">
                        <div className="flex items-center justify-center h-64">
                            <p className="text-gray-500">載入中...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="md:pl-64 lg:pl-72">
                    <div className="p-4 md:p-6 lg:p-8 pr-4 md:pr-6">
                        <div className="mb-6">
                            <Link
                                href="/collection-plans"
                                className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                返回收款計劃列表
                            </Link>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="md:pl-64 lg:pl-72">
                <div className="p-4 md:p-6 lg:p-8 pr-4 md:pr-6">
                    {/* Breadcrumb */}
                    <div className="mb-6">
                        <Link
                            href="/collection-plans"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            返回收款計劃列表
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">編輯收款計劃</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            代號：{planData?.code}
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <CollectionPlanForm initialData={planData} isEdit />
                    </div>
                </div>
            </div>
        </div>
    );
}
