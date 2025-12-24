'use client';

import CollectionPlanForm from '@/components/collection-plan/CollectionPlanForm';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function NewCollectionPlanPage() {
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
                        <h1 className="text-2xl font-bold text-gray-900">新增收款計劃</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            建立新的收款計劃設定
                        </p>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <CollectionPlanForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
