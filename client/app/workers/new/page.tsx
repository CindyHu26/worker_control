"use client";

import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import WorkerWizard from '@/components/workers/WorkerWizard';

export default function NewWorkerPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/workers" className="p-2 hover:bg-slate-100 rounded-full transition">
                    <ChevronLeft size={24} className="text-slate-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900">新增移工 (New Worker Registration)</h1>
                    <p className="text-slate-500 text-sm">Create a new worker profile or add deployment to existing worker.</p>
                </div>
            </div>

            <WorkerWizard />
        </div>
    );
}
