"use client";

import { useState, useEffect } from 'react';
import JobOrderList from '@/components/recruitment/JobOrderList';
import JobOrderForm from '@/components/recruitment/JobOrderForm';

export default function RecruitmentPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchJobs = () => {
        setLoading(true); // Optional: keep old data while refreshing? Or show spinner. Let's keep it simple.
        // Actually better to not flicker loading state if just refreshing list, but for now it's fine.
        fetch('http://localhost:3001/api/recruitment/job-orders')
            .then(res => res.json())
            .then(data => {
                setJobs(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 border-b border-gray-200 pb-4">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                            招募單管理
                        </span>
                        <span className="text-gray-900 ml-2 text-2xl font-semibold">Job Orders</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        管理所有雇主招募需求與國內求才時程監控 (Track Local Recruitment Deadlines)
                    </p>
                </header>

                <section>
                    <JobOrderForm onSuccess={fetchJobs} />
                </section>

                <section className="mt-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        所有訂單
                        <span className="ml-2 bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-xs">
                            {jobs.length}
                        </span>
                    </h2>
                    <JobOrderList jobOrders={jobs} isLoading={loading} />
                </section>
            </div>
        </div>
    );
}
