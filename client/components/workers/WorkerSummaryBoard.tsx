"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Briefcase, FileText, Calendar, ShieldCheck } from "lucide-react";

interface WorkerDashboardData {
    basic: {
        id: string;
        nameEn: string;
        nameCh: string;
        nationality: string;
        mobile: string;
        passportNo?: string;
        passportExpiry?: string;
        arcNo?: string;
        arcExpiry?: string;
    };
    job: {
        employerName?: string;
        workAddress?: string;
        salary?: number;
        jobType?: string;
    };
    permits: {
        recruitmentNo?: string;
        entryPermitNo?: string;
        employmentPermitNo?: string;
        employmentPermitDate?: string;
    };
    dates: {
        entryDate?: string;
        startDate?: string;
        endDate?: string;
    };
}

// 輔助函式：轉換民國年 (行政人員習慣)
function formatMinguoDate(dateString?: string) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const year = d.getFullYear() - 1911;
    const month = d.getMonth() + 1;
    const day = d.getDate();
    return `${year}/${month}/${day}`;
}

export default function WorkerSummaryBoard({ data }: { data: WorkerDashboardData | null }) {
    if (!data) return (
        <Card className="mb-6 border-dashed border-2 text-slate-400">
            <CardContent className="p-8 text-center">
                無當期有效派工或摘要資料可用
            </CardContent>
        </Card>
    );

    return (
        <Card className="mb-6 border-2 border-blue-50 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 py-2.5 px-4 border-b">
                <CardTitle className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    當期合約摘要 (Active Deployment Summary)
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {/* Responsive Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 text-sm">

                    {/* Row 1: Basic Identity */}
                    <div className="group flex flex-col md:contents">
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500 flex items-center gap-2">
                            <User className="w-3.5 h-3.5" /> 中文姓名
                        </div>
                        <div className="p-2.5 border-b border-r font-medium">{data.basic.nameCh || '-'}</div>
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500 flex items-center gap-2">
                            <span className="text-[10px] uppercase opacity-60">EN</span> 英文姓名
                        </div>
                        <div className="p-2.5 border-b font-medium">{data.basic.nameEn}</div>
                    </div>

                    {/* Row 2: Document Numbers */}
                    <div className="group flex flex-col md:contents">
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> 護照號碼
                        </div>
                        <div className="p-2.5 border-b border-r font-mono text-blue-600">{data.basic.passportNo || '-'}</div>
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500 flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> 居留證號
                        </div>
                        <div className="p-2.5 border-b font-mono text-blue-600">{data.basic.arcNo || '-'}</div>
                    </div>

                    {/* Row 3: Employer & Work Type */}
                    <div className="group flex flex-col md:contents">
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500 flex items-center gap-2">
                            <Briefcase className="w-3.5 h-3.5" /> 目前雇主
                        </div>
                        <div className="p-2.5 border-b border-r md:col-span-1 font-bold text-indigo-700">
                            {data.job.employerName || '尚未分派'}
                        </div>
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500">工作類別</div>
                        <div className="p-2.5 border-b">{data.job.jobType || '-'}</div>
                    </div>

                    {/* Row 4: Permits (Critical for Admin) */}
                    <div className="group flex flex-col md:contents">
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500">招募函號</div>
                        <div className="p-2.5 border-b border-r text-xs">{data.permits.recruitmentNo || '-'}</div>
                        <div className="p-2.5 bg-slate-50/50 border-b border-r font-semibold text-slate-500">聘僱許可</div>
                        <div className="p-2.5 border-b flex flex-col">
                            <span className="font-bold text-rose-600">{data.permits.employmentPermitNo || '尚未核發'}</span>
                            {data.permits.employmentPermitDate && (
                                <span className="text-[10px] text-slate-400">核發日: {formatMinguoDate(data.permits.employmentPermitDate)}</span>
                            )}
                        </div>
                    </div>

                    {/* Row 5: Key Dates */}
                    <div className="group flex flex-col md:contents">
                        <div className="p-2.5 bg-slate-50/30 border-r font-semibold text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> 入境日期
                        </div>
                        <div className="p-2.5 border-r font-medium text-slate-700">{formatMinguoDate(data.dates.entryDate)}</div>
                        <div className="p-2.5 bg-slate-50/30 border-r font-semibold text-slate-500 flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" /> 合約起迄
                        </div>
                        <div className="p-2.5 font-medium text-slate-700">
                            {formatMinguoDate(data.dates.startDate)} ~ {formatMinguoDate(data.dates.endDate)}
                        </div>
                    </div>

                </div>
            </CardContent>
        </Card>
    );
}
