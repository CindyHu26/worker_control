"use client";

import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Briefcase, Calendar, Users, AlertCircle, CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import JobRequisitionForm from './JobRequisitionForm';

interface JobOrder {
    id: string;
    employer: {
        companyName: string;
        taxId: string;
    };
    requiredWorkers: number;
    orderDate: string; // ISO string
    localRecruitmentDeadline?: string; // ISO string
    status: string;
    jobRequisition?: {
        skills?: string;
        salaryStructure?: string;
        leavePolicy?: string;
        workHours?: string;
        accommodation?: string;
        otherRequirements?: string;
    };
}

interface JobOrderListProps {
    jobOrders: JobOrder[];
    isLoading: boolean;
}

export default function JobOrderList({ jobOrders, isLoading }: JobOrderListProps) {
    const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
    const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);

    const handleOpenRequisition = (job: JobOrder) => {
        setSelectedJob(job);
        setIsRequisitionModalOpen(true);
    };

    if (isLoading) {
        return <div className="text-center py-10 text-gray-500">載入中...</div>;
    }

    if (jobOrders.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">尚無招募單</h3>
                <p className="mt-1 text-sm text-gray-500">請使用上方表單新增第一筆招募單。</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                雇主名稱 (Employer)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                需求人數
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                訂單日期
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                國內求才狀態 (Local Recruitment)
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                狀態
                            </th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">操作</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {jobOrders.map((job) => {
                            const orderDate = parseISO(job.orderDate);
                            const deadline = job.localRecruitmentDeadline ? parseISO(job.localRecruitmentDeadline) : null;
                            const today = new Date();

                            let recruitmentStatus = null;

                            if (deadline) {
                                const daysRemaining = differenceInCalendarDays(deadline, today);

                                if (daysRemaining >= 0) {
                                    recruitmentStatus = (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            <ClockIcon className="w-3 h-3 mr-1" />
                                            國內求才中 (剩餘 {daysRemaining} 天)
                                        </span>
                                    );
                                } else {
                                    recruitmentStatus = (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            可申請招募許可
                                        </span>
                                    );
                                }
                            } else {
                                recruitmentStatus = <span className="text-gray-400 text-xs">計算中...</span>;
                            }

                            return (
                                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-indigo-600">
                                                {job.employer.companyName}
                                            </div>
                                            <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                                {job.employer.taxId}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-900">
                                            <Users className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            {job.requiredWorkers}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            {format(orderDate, 'yyyy-MM-dd')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {recruitmentStatus}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleOpenRequisition(job)}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                        >
                                            <FileText className="w-4 h-4 mr-1" />
                                            Job Spec
                                        </button>
                                        <Link
                                            href={`/recruitment/job-orders/${job.id}`}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center ml-4"
                                        >
                                            Manage
                                            <ArrowRight className="w-4 h-4 ml-1" />
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {selectedJob && (
                <JobRequisitionForm
                    isOpen={isRequisitionModalOpen}
                    onClose={() => setIsRequisitionModalOpen(false)}
                    jobOrder={selectedJob}
                />
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        open: "bg-green-100 text-green-800",
        processing: "bg-yellow-100 text-yellow-800",
        completed: "bg-gray-100 text-gray-800",
        cancelled: "bg-red-100 text-red-800",
    };

    const labels = {
        open: "Open",
        processing: "Processing",
        completed: "Completed",
        cancelled: "Cancelled",
    };

    const s = status as keyof typeof styles;

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[s] || 'bg-gray-100 text-gray-800'}`}>
            {labels[s] || status}
        </span>
    );
}

function ClockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}
