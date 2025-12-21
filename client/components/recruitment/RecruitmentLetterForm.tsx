import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Building2, FileText, Receipt, Landmark } from 'lucide-react';
import { apiPost, apiPut } from '@/lib/api';

// Simple toast mock since generic useToast might not be present or configured similarly
const toast = (props: { title: string; description?: string; className?: string; variant?: string }) => {
    // console.log("Toast:", props);
    // In a real app we'd use the toaster context. For now, we rely on UI feedback or silent success + parent refresh.
    // Ideally, we can use window.alert for errors.
    if (props.variant === 'destructive') {
        alert(`${props.title}: ${props.description}`);
    }
};

interface Props {
    employerId: string;
    employer: any; // Full employer data for address selectors
    initialData?: any;
    onSuccess?: () => void;
    onCancel: () => void;
}

export function RecruitmentLetterForm({ employerId, employer, initialData, onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        // A. Industrial Bureau (Step 1)
        industrialBureauRef: '',
        industrialBureauDate: '',

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
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                employerId,
                approvedQuota: Number(formData.approvedQuota),
                reviewFeeAmount: Number(formData.reviewFeeAmount),
            };

            // Use the new /api/recruitment endpoint
            if (initialData?.id) {
                await apiPut(`/api/recruitment/${initialData.id}`, payload);
            } else {
                await apiPost('/api/recruitment', payload);
            }

            // toast({ title: "儲存成功" });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error(error);
            toast({
                title: "儲存失敗",
                description: error.message || "請檢查欄位格式",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

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
                        <Label>工業局核定函號</Label>
                        <Input
                            placeholder="例：112工中字第12345678號"
                            value={formData.industrialBureauRef}
                            onChange={e => setFormData({ ...formData, industrialBureauRef: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>核定函發文日</Label>
                        <Input
                            type="date"
                            value={formData.industrialBureauDate}
                            onChange={e => setFormData({ ...formData, industrialBureauDate: e.target.value })}
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
                        <Label className="flex justify-between">
                            <span>求才證明書序號</span>
                            <span className="text-xs text-orange-600 font-bold">*必填</span>
                        </Label>
                        <Input
                            placeholder="請輸入證明書序號"
                            value={formData.domesticRecruitmentRef}
                            onChange={e => setFormData({ ...formData, domesticRecruitmentRef: e.target.value })}
                        // Required only for new? strictness can be relaxed for editing legacy data. Use simple validation logic if needed.
                        // required={!initialData} 
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>求才登記日期</Label>
                        <Input
                            type="date"
                            value={formData.domesticRecruitmentDate}
                            onChange={e => setFormData({ ...formData, domesticRecruitmentDate: e.target.value })}
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
                        <Landmark size={20} /> 步驟四：勞動部招募許可函 (Recruitment Letter)
                    </CardTitle>
                </CardHeader>
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