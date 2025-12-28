"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, User, Phone, MapPin, Hash, Pencil, Trash2 } from 'lucide-react';
import EmployerSummaryBoard from '@/components/employers/EmployerSummaryBoard';
import RecruitmentLetterManager from '@/components/employers/RecruitmentLetterManager';
import LaborCountManager from '@/components/employers/LaborCountManager';
import EmployerReadinessDashboard from '@/components/employers/EmployerReadinessDashboard';
import ContractList from '@/components/contracts/ContractList';
import PrePermitManager from '@/components/employers/PrePermitManager';
import { apiGet, apiDelete } from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface Employer {
    id: string;
    companyName: string;
    taxId: string;
    responsiblePerson?: string;
    phoneNumber?: string;
    address?: string;
    category?: {
        type: string;
        code: string;
        nameZh: string;
    };
    // Basic fields
    code?: string;
    totalQuota?: number;
    industryType?: string;
    summary?: any;
    _count?: {
        workers: number;
        deployments: number;
    };
    // [Added] Nested Relations
    individualInfo?: {
        patientName?: string;
        patientIdNo?: string;
        careAddress?: string;
        relationship?: string;
    };
    corporateInfo?: {
        industryType?: string;
    };
    factories?: any[];
    recruitmentLetters?: any[];
}

export default function EmployerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    const [employer, setEmployer] = useState<Employer | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await apiDelete(`/api/employers/${id}`);
            toast.success('雇主已刪除');
            router.push('/employers');
            router.refresh();
        } catch (err: any) {
            console.error(err);
            toast.error('刪除失敗: ' + (err.message || '未知錯誤'));
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        const fetchEmployer = async () => {
            try {
                const data = await apiGet<Employer>(`/api/employers/${id}`);
                setEmployer(data);
            } catch (err: any) {
                console.error(err);
                toast.error('無法載入雇主資料: ' + (err.message || '未知錯誤'));
            } finally {
                setLoading(false);
            }
        };

        fetchEmployer();
    }, [id]);

    if (loading) return <div className="p-8 text-center text-gray-500">載入雇主資料中...</div>;
    if (!employer) return <div className="p-8 text-center text-red-500">找不到雇主資料</div>;

    // Logic for Conditional Rendering
    const isIndividual = employer.category?.type === 'INDIVIDUAL';
    const isManufacturing = employer.category?.code === 'MANUFACTURING';

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Readiness Dashboard */}
                <EmployerReadinessDashboard employerId={id} />

                {/* Basic Info Card */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            {employer.companyName}
                            {employer.code && <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2">#{employer.code}</span>}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/employers/${id}/edit`)}
                                className="flex items-center gap-1"
                            >
                                <Pencil className="w-4 h-4" /> 編輯 (Edit)
                            </Button>

                            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex items-center gap-1"
                                    >
                                        <Trash2 className="w-4 h-4" /> 刪除 (Delete)
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>確定要刪除此雇主嗎？(Confirm Delete)</DialogTitle>
                                        <DialogDescription>
                                            此動作將無法復原。將會永久刪除此雇主及其相關資料。
                                            <br />
                                            (This action cannot be undone. This will permanently delete the employer and related data.)
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                                            取消 (Cancel)
                                        </Button>
                                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                            {isDeleting ? '刪除中...' : '確認刪除 (Delete)'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Hash className="h-4 w-4" /> {isIndividual ? '身分證字號 (ID Number)' : '統一編號 (Tax ID)'}
                                </div>
                                <div className="font-mono">{employer.taxId || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <User className="h-4 w-4" /> 負責人 (Responsible Person)
                                </div>
                                <div>{employer.responsiblePerson || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <Phone className="h-4 w-4" /> 聯絡電話 (Phone)
                                </div>
                                <div>{employer.phoneNumber || '-'}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin className="h-4 w-4" /> 地址 (Address)
                                </div>
                                <div>{employer.address || '-'}</div>
                            </div>
                            {/* [New] Total Quota Display - Only for Business/Manufacturing usually, or keep valid */}
                            {/* Showing for all as it might be relevant, but Tier is specific */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <span className="font-bold border border-blue-400 bg-blue-50 text-blue-600 rounded px-1 text-xs">SUM</span> 目前可用名額 (Quota)
                                </div>
                                <div className="text-2xl font-bold text-green-600 pl-1">
                                    {employer.totalQuota ?? 0} <span className="text-sm font-normal text-gray-500">人</span>
                                </div>
                            </div>

                            {/* [Added] Dynamic Tier Display - Only for Manufacturing */}
                            {isManufacturing && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <span className="font-bold border border-gray-400 rounded px-1 text-xs">3K</span> 核定級別 (Tier)
                                    </div>
                                    <div>
                                        {(() => {
                                            // Filter for valid recognitions
                                            const recognitions = (employer as any).industryRecognitions || [];
                                            const now = new Date();
                                            const activeRec = recognitions.find((doc: any) => {
                                                // Check if not expired (or no expiry date)
                                                if (doc.expiryDate && new Date(doc.expiryDate) < now) return false;
                                                return true;
                                            });

                                            if (activeRec) {
                                                const rate = activeRec.allocationRate
                                                    ? (Number(activeRec.allocationRate) * 100).toFixed(0) + '%'
                                                    : '?%';
                                                return (
                                                    <div>
                                                        <span className="text-blue-600 font-bold text-lg">
                                                            {activeRec.tier} 級 ({rate})
                                                        </span>
                                                        <div className="text-xs text-gray-400">
                                                            {activeRec.bureauRefNumber}
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return <span className="text-gray-400 text-sm">無有效核定 (No Valid Permit)</span>;
                                            }
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* [New] Patient Info Card (For Individual Employers) */}
                {isIndividual && employer.individualInfo && (
                    <Card className="bg-purple-50 border-purple-100">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-bold flex items-center gap-2 text-purple-900">
                                <User className="h-5 w-5 text-purple-600" />
                                被看護人資料 (Patient Info)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                                <div className="space-y-1">
                                    <div className="text-purple-600 font-medium">被看護人姓名 (Patient Name)</div>
                                    <div className="font-medium text-gray-900">{employer.individualInfo.patientName || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-purple-600 font-medium">被看護人身分證字號 (Patient ID)</div>
                                    <div className="font-mono text-gray-900">{employer.individualInfo.patientIdNo || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-purple-600 font-medium">與雇主關係 (Relationship)</div>
                                    <div className="text-gray-900">{employer.individualInfo.relationship || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-purple-600 font-medium">照護地址 (Care Address)</div>
                                    <div className="text-gray-900">{employer.individualInfo.careAddress || '-'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Header Summary Board */}
                <EmployerSummaryBoard data={employer.summary} />

                {/* Labor Insurance Count Management - Only for Manufacturing */}
                {isManufacturing && <LaborCountManager employerId={id} />}

                {/* Pre-Permit Management (Industry Recognitions & Recruitment Proofs) */}
                {/* Industry Recognitions hidden for non-manufacturing */}
                <PrePermitManager
                    employerId={id}
                    showIndustryRecognitions={isManufacturing}
                />

                {/* Recruitment Letter Management Section */}
                <RecruitmentLetterManager employerId={id} />

                {/* Contract Management Section */}
                <ContractList employerId={id} />

                {/* Placeholder for future sections */}
                <div className="p-6 border-2 border-dashed border-gray-200 rounded-lg text-center text-gray-400">
                    此處將顯示更多雇主詳情 (如歷史案件、聯絡紀錄等)
                </div>
            </div>
        </div>
    );
}
