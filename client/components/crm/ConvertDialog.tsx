'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRIES, IndustryKey, requiresFactoryInfo, ALLOCATION_RATES, BASE_RATES, EXTRA_RATES } from '@/lib/leadConstants';
import { AlertCircle, Loader2, Calculator } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ConvertDialogProps {
    open: boolean;
    onClose: () => void;
    lead: {
        id: string;
        companyName: string | null;
        taxId: string | null;
        industry: string | null;
        address: string | null;
    };
    onSuccess: () => void;
}

interface ConvertFormData {
    taxId: string;
    industryType: string;
    industryCode?: string;
    invoiceAddress: string;
    factoryAddress?: string;
    avgDomesticWorkers?: number;
    allocationRate?: number;
    baseRate?: string;
    extraRate?: string;
    isExtra?: boolean;
    complianceStandard?: string;
}

// Helper function to calculate 3K5 Quota
const calculate3K5Quota = (laborCount: number, rate: number): number => {
    const raw = laborCount * rate;
    if (raw === Math.floor(raw)) return raw;
    const firstDecimal = Math.floor((raw * 10) % 10);
    return firstDecimal > 0 ? Math.ceil(raw) : Math.floor(raw);
};

// Map industry enum to code
const getIndustryCode = (industry: string): string => {
    const mapping: Record<string, string> = {
        'MANUFACTURING': '01',
        'CONSTRUCTION': '02',
        'FISHERY': '03',
        'AGRICULTURE': '04',
        'SLAUGHTER': '05',
        'HOME_CARE': '06',
        'HOME_HELPER': '07',
        'INSTITUTION': '08',
        'OUTREACH_AGRICULTURE': '09',
        'HOSPITALITY': '10',
        'OTHER': '99'
    };
    return mapping[industry] || '01';
};

export default function ConvertDialog({ open, onClose, lead, onSuccess }: ConvertDialogProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ConvertFormData>({
        taxId: lead.taxId || '',
        industryType: lead.industry || 'MANUFACTURING',
        industryCode: getIndustryCode(lead.industry || 'MANUFACTURING'),
        invoiceAddress: lead.address || '',
        factoryAddress: lead.address || '',
        avgDomesticWorkers: 0,
        allocationRate: 0.15,
        baseRate: '0.15',
        extraRate: '0.00',
        isExtra: false,
        complianceStandard: 'NONE'
    });

    // Update form when lead changes
    useEffect(() => {
        if (open) {
            setFormData({
                taxId: lead.taxId || '',
                industryType: lead.industry || 'MANUFACTURING',
                industryCode: getIndustryCode(lead.industry || 'MANUFACTURING'),
                invoiceAddress: lead.address || '',
                factoryAddress: lead.address || '',
                avgDomesticWorkers: 0,
                allocationRate: 0.15,
                baseRate: '0.15',
                extraRate: '0.00',
                isExtra: false,
                complianceStandard: 'NONE'
            });
            setError(null);
        }
    }, [open, lead]);

    const handleChange = (field: keyof ConvertFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    const handleIndustryChange = (industryType: string) => {
        setFormData(prev => ({
            ...prev,
            industryType,
            industryCode: getIndustryCode(industryType)
        }));
    };

    // Calculate Total Rate in Effect
    useEffect(() => {
        if (formData.baseRate) {
            const base = parseFloat(formData.baseRate);
            const extra = formData.isExtra && formData.extraRate ? parseFloat(formData.extraRate) : 0;
            const total = Math.min(0.40, base + extra);
            setFormData(prev => ({ ...prev, allocationRate: total }));
        }
    }, [formData.baseRate, formData.extraRate, formData.isExtra]);

    const validate = (): boolean => {
        if (!formData.taxId || formData.taxId.length !== 8) {
            setError('統一編號必須為8碼');
            return false;
        }

        if (!formData.invoiceAddress) {
            setError('請填寫公司登記地址');
            return false;
        }

        // Manufacturing-specific validation
        if (requiresFactoryInfo(formData.industryType)) {
            if (!formData.factoryAddress) {
                setError('製造業轉正必須填寫：工廠地址');
                return false;
            }
            if (!formData.avgDomesticWorkers || formData.avgDomesticWorkers <= 0) {
                setError('製造業轉正必須填寫：國內勞工人數');
                return false;
            }
            if (!formData.allocationRate) {
                setError('製造業轉正必須填寫：核配比率');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`/api/leads/${lead.id}/convert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operatorId: 'system', // TODO: Get from auth
                    ...formData
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                // Parse backend error messages
                if (errorData.error?.includes('Factory address')) {
                    throw new Error('轉正失敗：製造業必須填寫工廠地址與核配比率。');
                } else if (errorData.error?.includes('工廠地址')) {
                    throw new Error(errorData.error);
                } else {
                    throw new Error(errorData.error || '轉正失敗');
                }
            }

            const data = await res.json();
            toast.success('客戶轉正成功！正在跳轉至雇主頁面...');

            // Auto-redirect to employer page
            if (data.employer?.id) {
                setTimeout(() => {
                    router.push(`/employers/${data.employer.id}`);
                }, 1000);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || '系統錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const isManufacturing = requiresFactoryInfo(formData.industryType);
    const quota = isManufacturing && formData.avgDomesticWorkers && formData.allocationRate
        ? calculate3K5Quota(formData.avgDomesticWorkers, formData.allocationRate)
        : 0;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>轉為正式客戶</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Company Name - Display Only */}
                        <div className="col-span-2">
                            <Label>公司名稱</Label>
                            <Input value={lead.companyName || ''} disabled className="bg-gray-50" />
                        </div>

                        {/* Tax ID */}
                        <div className="col-span-2">
                            <Label htmlFor="taxId" className="required">統一編號</Label>
                            <Input
                                id="taxId"
                                value={formData.taxId}
                                onChange={(e) => handleChange('taxId', e.target.value)}
                                placeholder="8位數統編"
                                maxLength={8}
                                required
                            />
                        </div>

                        {/* Industry Type */}
                        <div className="col-span-2">
                            <Label htmlFor="industryType" className="required">產業別</Label>
                            <Select
                                value={formData.industryType}
                                onValueChange={handleIndustryChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="請選擇產業別" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(INDUSTRIES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Invoice Address */}
                        <div className="col-span-2">
                            <Label htmlFor="invoiceAddress" className="required">公司登記地址</Label>
                            <Input
                                id="invoiceAddress"
                                value={formData.invoiceAddress}
                                onChange={(e) => handleChange('invoiceAddress', e.target.value)}
                                placeholder="公司登記地址"
                                required
                            />
                        </div>

                        {/* Manufacturing-specific fields */}
                        {isManufacturing && (
                            <>
                                <div className="col-span-2">
                                    <Label htmlFor="factoryAddress" className="required">工廠地址</Label>
                                    <Input
                                        id="factoryAddress"
                                        value={formData.factoryAddress || ''}
                                        onChange={(e) => handleChange('factoryAddress', e.target.value)}
                                        placeholder="工廠登記地址"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">需用於申請宿舍</p>
                                </div>

                                <div>
                                    <Label htmlFor="avgDomesticWorkers" className="required">國內勞工人數</Label>
                                    <Input
                                        id="avgDomesticWorkers"
                                        type="number"
                                        min="1"
                                        value={formData.avgDomesticWorkers || ''}
                                        onChange={(e) => handleChange('avgDomesticWorkers', e.target.value ? parseInt(e.target.value) : undefined)}
                                        placeholder="例如：125"
                                        required
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <Label className="required">核配比率 (Allocation Rate)</Label>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id="isExtraConvert"
                                                checked={formData.isExtra}
                                                onChange={(e) => handleChange('isExtra', e.target.checked)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <Label htmlFor="isExtraConvert" className="text-[10px] text-gray-500 cursor-pointer">申請 Extra</Label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Select
                                            value={formData.baseRate}
                                            onValueChange={(value) => handleChange('baseRate', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="級別" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {BASE_RATES.map((rate) => (
                                                    <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={formData.extraRate}
                                            onValueChange={(value) => handleChange('extraRate', value)}
                                            disabled={!formData.isExtra}
                                        >
                                            <SelectTrigger className={!formData.isExtra ? "opacity-50" : ""}>
                                                <SelectValue placeholder="Extra" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EXTRA_RATES.map((rate) => (
                                                    <SelectItem key={rate.value} value={rate.value}>{rate.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {quota > 0 && (
                                    <div className="col-span-2 bg-blue-50 border border-blue-200 p-4 rounded">
                                        <div className="flex items-center gap-2 text-blue-800 font-medium mb-1">
                                            <Calculator className="h-5 w-5" />
                                            3K5 配額試算
                                        </div>
                                        <p className="text-sm text-blue-700">
                                            {formData.avgDomesticWorkers} × {(formData.allocationRate || 0) * 100}% = <strong>{quota} 人</strong>
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            確認轉換
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
