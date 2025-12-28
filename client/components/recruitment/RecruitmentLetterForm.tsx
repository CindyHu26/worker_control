import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Building2, FileText, Receipt, Landmark } from 'lucide-react';
import { apiPost, apiPut } from '@/lib/api';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Props {
    employerId: string;
    employer: any; // Full employer data for address selectors
    initialData?: any;
    onSuccess?: () => void;
    onCancel: () => void;
}

export function RecruitmentLetterForm({ employerId, employer, initialData, onSuccess, onCancel }: Props) {
    const { data: industryRecognitions } = useSWR(
        employerId ? `/api/industry-recognitions?employerId=${employerId}` : null,
        fetcher
    );
    const { data: recruitmentProofs } = useSWR(
        employerId ? `/api/recruitment-proofs?employerId=${employerId}` : null,
        fetcher
    );

    const [selectedIndRec, setSelectedIndRec] = useState<string>('');
    const [selectedProof, setSelectedProof] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    // Form State
    const [formData, setFormData] = useState({
        // A. Industrial Bureau (Step 1)
        industrialBureauRef: '',
        industrialBureauDate: '',
        industryTier: '', // Hidden or auto-filled

        // B. Domestic Recruitment (Step 2)
        domesticRecruitmentRef: '',
        domesticRecruitmentDate: '',

        // C. Review Fee (Step 3)
        reviewFeeReceiptNo: '',
        reviewFeePayDate: '',
        reviewFeeAmount: 200,

        // D. Recruitment Letter (Step 4)
        letterNumber: '',
        issueDate: '',
        validUntil: '',
        approvedQuota: 0,
        workAddress: '',
        remarks: ''
    });

    useEffect(() => {
        if (initialData) {
            const format = (d: string) => d ? d.split('T')[0] : '';
            setFormData({
                industrialBureauRef: initialData.industrialBureauRef || '',
                industrialBureauDate: format(initialData.industrialBureauDate),
                industryTier: initialData.industryTier || '',
                domesticRecruitmentRef: initialData.domesticRecruitmentRef || '',
                domesticRecruitmentDate: format(initialData.domesticRecruitmentDate),
                reviewFeeReceiptNo: initialData.reviewFeeReceiptNo || '',
                reviewFeePayDate: format(initialData.reviewFeePayDate),
                reviewFeeAmount: initialData.reviewFeeAmount || 200,
                letterNumber: initialData.letterNumber || '',
                issueDate: format(initialData.issueDate),
                validUntil: format(initialData.validUntil || initialData.expiryDate), // Handle both
                approvedQuota: initialData.approvedQuota || 0,
                workAddress: initialData.workAddress || '',
                remarks: initialData.remarks || ''
            });
            // Also set selected IDs if they exist (need backend to return them in initialData)
            if (initialData.industryRecognitionId) setSelectedIndRec(initialData.industryRecognitionId);
            if (initialData.recruitmentProofId) setSelectedProof(initialData.recruitmentProofId);
        }
    }, [initialData]);

    const handleIndRecChange = (id: string) => {
        setSelectedIndRec(id);
        const item = industryRecognitions?.find((x: any) => x.id === id);
        if (item) {
            const remaining = item.approvedQuota - item.usedQuota;

            if (item.allocationRate) {
                // setValue('allocationRate', item.allocationRate); // Not using RHF
                // State update:
                const rate = Number(item.allocationRate);
                // Calculate quota from labor count
                let calculatedQuota = 0;
                if (employer && employer.laborCounts && employer.laborCounts.length > 0) {
                    const latestCount = employer.laborCounts[0];
                    calculatedQuota = Math.floor(latestCount.count * rate);
                }

                setFormData(prev => ({
                    ...prev,
                    approvedQuota: calculatedQuota,
                    industrialBureauRef: item.bureauRefNumber,
                    industrialBureauDate: item.issueDate ? item.issueDate.split('T')[0] : '',
                    industryTier: item.tier,
                }));
                toast.info(`已選定核定函：級別 ${item.tier} (Ratio: ${item.allocationRate})`);
            } else {
                setFormData(prev => ({
                    ...prev,
                    industrialBureauRef: item.bureauRefNumber,
                    industrialBureauDate: item.issueDate ? item.issueDate.split('T')[0] : '',
                    industryTier: item.tier,
                }));
            }
        }
    };

    const handleProofChange = (id: string) => {
        setSelectedProof(id);
        const item = recruitmentProofs?.find((x: any) => x.id === id);
        if (item) {
            setFormData(prev => ({
                ...prev,
                domesticRecruitmentRef: item.receiptNumber,
                domesticRecruitmentDate: item.issueDate ? item.issueDate.split('T')[0] : '',
                reviewFeeReceiptNo: item.reviewFeeReceiptNo || prev.reviewFeeReceiptNo,
                reviewFeePayDate: item.reviewFeePayDate ? item.reviewFeePayDate.split('T')[0] : prev.reviewFeePayDate
            }));
            toast.info(`已選定求才證明：${item.receiptNumber}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                employerId,
                approvedQuota: Number(formData.approvedQuota),
                reviewFeeAmount: Number(formData.reviewFeeAmount),
                industryRecognitionId: selectedIndRec || undefined,
                recruitmentProofId: selectedProof || undefined
            };

            // Use the new /api/recruitment endpoint
            if (initialData?.id) {
                await apiPut(`/api/recruitment/${initialData.id}`, payload);
            } else {
                await apiPost('/api/recruitment', payload);
            }

            toast.success("招募函資料已儲存");
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || "儲存失敗";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const indRecList = industryRecognitions || [];
    const proofList = recruitmentProofs || [];

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">

            {/* Step 1: Industrial Bureau */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                        <Building2 size={18} /> 步驟一：工業局 3K 認定 (Industrial Bureau)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>選擇工業局核定函 (選填)</Label>
                        <Select value={selectedIndRec} onValueChange={handleIndRecChange} disabled={!!initialData?.id}>
                            <SelectTrigger>
                                <SelectValue placeholder="請選擇現有核定函..." />
                            </SelectTrigger>
                            <SelectContent>
                                {indRecList.map((item: any) => {
                                    const bal = item.approvedQuota - item.usedQuota;
                                    return (
                                        <SelectItem key={item.id} value={item.id}>
                                            {item.bureauRefNumber} ({item.tier}級 / 餘額:{bal})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>工業局核定函號 (自動帶入)</Label>
                        <Input
                            placeholder="例：112工中字第12345678號"
                            value={formData.industrialBureauRef}
                            onChange={e => setFormData({ ...formData, industrialBureauRef: e.target.value })}
                            readOnly={!!selectedIndRec}
                            className={selectedIndRec ? "bg-gray-100" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>核定函發文日</Label>
                        <Input
                            type="date"
                            value={formData.industrialBureauDate}
                            onChange={e => setFormData({ ...formData, industrialBureauDate: e.target.value })}
                            readOnly={!!selectedIndRec}
                            className={selectedIndRec ? "bg-gray-100" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>核定級別 (Tier)</Label>
                        <Input
                            value={formData.industryTier}
                            readOnly
                            className="bg-gray-100"
                            placeholder="自動帶入"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Step 2: Domestic Recruitment */}
            <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                        <FileText size={18} /> 步驟二：國內求才證明 (Domestic Recruitment)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>選擇求才證明書 (選填)</Label>
                        <Select value={selectedProof} onValueChange={handleProofChange} disabled={!!initialData?.id}>
                            <SelectTrigger>
                                <SelectValue placeholder="請選擇有效之證明書..." />
                            </SelectTrigger>
                            <SelectContent>
                                {proofList.map((item: any) => (
                                    <SelectItem key={item.id} value={item.id}>
                                        {item.receiptNumber} (發文:{item.issueDate?.split('T')[0]})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="flex justify-between">
                            <span>求才證明書序號</span>
                            <span className="text-xs text-orange-600 font-bold">*必填</span>
                        </Label>
                        <Input
                            placeholder="請輸入證明書序號"
                            value={formData.domesticRecruitmentRef}
                            onChange={e => setFormData({ ...formData, domesticRecruitmentRef: e.target.value })}
                            readOnly={!!selectedProof}
                            className={selectedProof ? "bg-gray-100" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>求才登記日期</Label>
                        <Input
                            type="date"
                            value={formData.domesticRecruitmentDate}
                            onChange={e => setFormData({ ...formData, domesticRecruitmentDate: e.target.value })}
                            readOnly={!!selectedProof}
                            className={selectedProof ? "bg-gray-100" : ""}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Step 3: Review Fee */}
            <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-700">
                        <Receipt size={18} /> 步驟三：審查費繳納 (Review Fee)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>收據號碼 (郵政劃撥)</Label>
                        <Input
                            placeholder="例：98765432"
                            value={formData.reviewFeeReceiptNo}
                            onChange={e => setFormData({ ...formData, reviewFeeReceiptNo: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>繳費日期</Label>
                        <Input
                            type="date"
                            value={formData.reviewFeePayDate}
                            onChange={e => setFormData({ ...formData, reviewFeePayDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>繳費金額</Label>
                        <Input
                            type="number"
                            value={formData.reviewFeeAmount}
                            onChange={e => setFormData({ ...formData, reviewFeeAmount: Number(e.target.value) })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Step 4: Recruitment Letter (Main) */}
            <Card className="border-2 border-blue-600 shadow-md">
                <CardHeader className="bg-blue-50 pb-2 border-b">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-blue-800">
                        <Landmark size={20} />
                        {['HOME_CARE', 'HOME_HELPER', 'MID_HOME_CARE'].includes(employer?.category || '')
                            ? '步驟四：勞動部核准函 (Approval Letter)'
                            : '步驟四：勞動部招募許可函 (Recruitment Permit)'}
                    </CardTitle>
                </CardHeader>
                <div className="bg-yellow-50 border-1 border-yellow-200 p-2 text-sm text-yellow-800 flex items-center gap-2 mx-4 mt-4 rounded">
                    <span className="font-bold">⚠️ 合規提示：</span> 請依照勞動部正式核發之公文如實填寫，此欄位將用作「可用名額」計算依據。
                </div>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-2">
                        <Label className="text-blue-900 font-bold">發文文號 (Permit No)</Label>
                        <Input
                            className="font-mono font-bold"
                            placeholder="勞動發事字第...號"
                            value={formData.letterNumber}
                            onChange={e => setFormData({ ...formData, letterNumber: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-blue-900 font-bold">核准名額</Label>
                        <Input
                            type="number"
                            className="text-lg font-bold text-red-600"
                            value={formData.approvedQuota}
                            onChange={e => setFormData({ ...formData, approvedQuota: Number(e.target.value) })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>發文日期</Label>
                        <Input
                            type="date"
                            value={formData.issueDate}
                            onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>招募效期 (通常發文日+1年)</Label>
                        <Input
                            type="date"
                            value={formData.validUntil}
                            onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
                            required
                        />
                    </div>

                    {/* Address Selector */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>外勞工作地址</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.workAddress}
                                onValueChange={(val) => setFormData({ ...formData, workAddress: val })}
                            >
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="快速選擇..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {employer?.address && (
                                        <SelectItem value={employer.address}>公司地址 ({employer.address.substring(0, 6)}...)</SelectItem>
                                    )}
                                    {employer?.factories?.map((f: any, idx: number) => (
                                        <SelectItem key={f.id || idx} value={f.address || ''}>
                                            {f.name || `工廠 ${idx + 1}`} ({f.address ? f.address.substring(0, 6) : '無地址'}...)
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="MANUAL_INPUT">(手動輸入)</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="請輸入完整中文地址"
                                value={formData.workAddress}
                                onChange={e => setFormData({ ...formData, workAddress: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <Label>備註</Label>
                        <Input
                            value={formData.remarks}
                            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={onCancel}>取消</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? "儲存中..." : "確認送出招募函資料"}
                </Button>
            </div>
        </form>
    );
}