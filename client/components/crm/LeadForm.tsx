'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { INDUSTRIES, IndustryKey, PROGRAM_TYPES, JOB_CATEGORIES, ENTITY_TYPES, ProgramTypeKey } from '@/lib/leadConstants';
import { AlertCircle, Loader2 } from 'lucide-react';

interface LeadFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: LeadFormData) => Promise<void>;
    initialData?: Partial<LeadFormData>;
    mode?: 'create' | 'edit';
}

export interface LeadFormData {
    companyName: string;
    taxId?: string;
    contactPerson?: string;
    jobTitle?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    lineId?: string;
    address?: string;
    industry?: string;
    estimatedWorkerCount?: number;
    source?: string;
}

export default function LeadForm({ open, onClose, onSubmit, initialData, mode = 'create' }: LeadFormProps) {
    // 1. Determine initial program type based on industry
    const getInitialProgramType = (industry?: string): ProgramTypeKey => {
        if (!industry) return 'GENERAL';

        if (industry in JOB_CATEGORIES.MID_LEVEL) return 'MID_LEVEL';
        if (industry in JOB_CATEGORIES.DIRECT_HIRE) return 'DIRECT_HIRE';
        return 'GENERAL';
    };

    const [formData, setFormData] = useState<LeadFormData>({
        companyName: '',
        ...initialData
    });
    const [programType, setProgramType] = useState<ProgramTypeKey>(getInitialProgramType(initialData?.industry));

    // For hybrid types (Agriculture), track if user is Juridical Person
    const [isJuridicalPerson, setIsJuridicalPerson] = useState(true);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [taxIdChecking, setTaxIdChecking] = useState(false);
    const [taxIdError, setTaxIdError] = useState<string | null>(null);

    const handleChange = (field: keyof LeadFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError(null);
    };

    // Determine Entity Requirement
    const getEntityRequirement = (industry?: string) => {
        if (!industry) return 'BUSINESS'; // Default
        if (ENTITY_TYPES.BUSINESS_REQUIRED.includes(industry as any)) return 'BUSINESS';
        if (ENTITY_TYPES.INDIVIDUAL_REQUIRED.includes(industry as any)) return 'INDIVIDUAL';
        if (ENTITY_TYPES.HYBRID.includes(industry as any)) return 'HYBRID';
        return 'BUSINESS'; // Fallback
    };

    const entityReq = getEntityRequirement(formData.industry);
    const isBusiness = entityReq === 'BUSINESS' || (entityReq === 'HYBRID' && isJuridicalPerson);

    const idLabel = isBusiness ? '統一編號' : '身分證字號';
    const idPlaceholder = isBusiness ? '8位數統編' : '10碼身分證字號';
    const idMaxLength = isBusiness ? 8 : 10;

    const checkTaxId = async (idValue: string) => {
        if (!idValue || idValue.length < (isBusiness ? 8 : 10)) {
            setTaxIdError(null);
            return;
        }

        // Validate format before API check
        if (isBusiness && !/^\d{8}$/.test(idValue)) {
            // setTaxIdError('統編格式錯誤'); // Optional: Add client-side format check
            // Let backend or submit check handle strict format, or add here.
        }

        // Skip check in edit mode if taxId hasn't changed
        if (mode === 'edit' && idValue === initialData?.taxId) {
            return;
        }

        setTaxIdChecking(true);
        try {
            const token = Cookies.get('token');
            // Use different query param or endpoint if checking ID card, but seemingly API is check-tax-id?
            // Assuming the API handles both or we just check uniqueness. 
            // For now use the existing taxId check endpoint.
            const res = await fetch(`/api/leads/check-tax-id?taxId=${idValue}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.status === 409) {
                setTaxIdError(data.error);
            } else {
                setTaxIdError(null);
            }
        } catch (err) {
            console.error('ID check failed:', err);
        } finally {
            setTaxIdChecking(false);
        }
    };

    const handleTaxIdChange = (value: string) => {
        handleChange('taxId', value);
        setTaxIdError(null);

        // Debounce the check
        const timeoutId = setTimeout(() => {
            checkTaxId(value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    const handleProgramTypeChange = (value: ProgramTypeKey) => {
        setProgramType(value);
        // Clear industry when program type changes to force re-selection
        handleChange('industry', '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName) {
            setError('公司名稱/雇主姓名 為必填欄位');
            return;
        }

        if (taxIdError) {
            setError(`請先解決${idLabel}衝突問題`);
            return;
        }

        if (!formData.industry) {
            setError('請選擇工作項目');
            return;
        }

        // Basic length check
        if (formData.taxId) {
            if (isBusiness && formData.taxId.length !== 8) {
                setError('統編應為8碼');
                return;
            }
            if (!isBusiness && formData.taxId.length !== 10) {
                setError('身分證字號應為10碼');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            setError(err.message || '操作失敗');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? '新增潛在客戶' : '編輯潛在客戶'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {/* Company Name / Employer Name */}
                        <div className="col-span-2">
                            <Label htmlFor="companyName" className="required">公司名稱 / 雇主姓名</Label>
                            <Input
                                id="companyName"
                                value={formData.companyName}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                placeholder="請輸入公司名稱或雇主姓名"
                                required
                            />
                        </div>

                        {/* Program Type Selection */}
                        <div className="col-span-2">
                            <Label>申請類別</Label>
                            <Select
                                value={programType}
                                onValueChange={(val: ProgramTypeKey) => handleProgramTypeChange(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PROGRAM_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Job Category (Industry) Selection */}
                        <div className="col-span-2">
                            <Label htmlFor="industry" className="required">工作項目</Label>
                            <Select
                                value={formData.industry || ''}
                                onValueChange={(value) => handleChange('industry', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="請選擇工作項目" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(JOB_CATEGORIES[programType]).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hybrid Entity Toggle */}
                        {entityReq === 'HYBRID' && (
                            <div className="col-span-2 flex items-center gap-2">
                                <Label>雇主類型：</Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={isJuridicalPerson}
                                            onChange={() => setIsJuridicalPerson(true)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>法人 (需統編)</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!isJuridicalPerson}
                                            onChange={() => setIsJuridicalPerson(false)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span>自然人 (需身分證)</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Tax ID / ID Card */}
                        <div className="col-span-2">
                            <Label htmlFor="taxId">{idLabel}</Label>
                            <div className="relative">
                                <Input
                                    id="taxId"
                                    value={formData.taxId || ''}
                                    onChange={(e) => handleTaxIdChange(e.target.value)}
                                    placeholder={idPlaceholder}
                                    maxLength={idMaxLength}
                                    className={taxIdError ? 'border-red-500' : ''}
                                />
                                {taxIdChecking && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                )}
                            </div>
                            {taxIdError && (
                                <p className="text-sm text-red-600 mt-1">{taxIdError}</p>
                            )}
                        </div>

                        {/* Contact Person */}
                        <div>
                            <Label htmlFor="contactPerson">聯絡人</Label>
                            <Input
                                id="contactPerson"
                                value={formData.contactPerson || ''}
                                onChange={(e) => handleChange('contactPerson', e.target.value)}
                                placeholder="負責人姓名"
                            />
                        </div>

                        {/* Job Title */}
                        <div>
                            <Label htmlFor="jobTitle">職稱</Label>
                            <Input
                                id="jobTitle"
                                value={formData.jobTitle || ''}
                                onChange={(e) => handleChange('jobTitle', e.target.value)}
                                placeholder="總經理、廠長等"
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <Label htmlFor="phone">市話</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="02-12345678"
                            />
                        </div>

                        {/* Mobile */}
                        <div>
                            <Label htmlFor="mobile">手機</Label>
                            <Input
                                id="mobile"
                                value={formData.mobile || ''}
                                onChange={(e) => handleChange('mobile', e.target.value)}
                                placeholder="0912-345-678"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="example@company.com"
                            />
                        </div>

                        {/* LINE ID */}
                        <div>
                            <Label htmlFor="lineId">LINE ID</Label>
                            <Input
                                id="lineId"
                                value={formData.lineId || ''}
                                onChange={(e) => handleChange('lineId', e.target.value)}
                                placeholder="LINE帳號"
                            />
                        </div>

                        {/* Estimated Worker Count */}
                        <div>
                            <Label htmlFor="estimatedWorkerCount">預計引進人數</Label>
                            <Input
                                id="estimatedWorkerCount"
                                type="number"
                                min="0"
                                value={formData.estimatedWorkerCount || ''}
                                onChange={(e) => handleChange('estimatedWorkerCount', e.target.value ? parseInt(e.target.value) : undefined)}
                                placeholder="預計人數"
                            />
                        </div>

                        {/* Source */}
                        <div>
                            <Label htmlFor="source">客戶來源</Label>
                            <Input
                                id="source"
                                value={formData.source || ''}
                                onChange={(e) => handleChange('source', e.target.value)}
                                placeholder="展會、轉介紹等"
                            />
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <Label htmlFor="address">地址</Label>
                            <Textarea
                                id="address"
                                value={formData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="公司地址"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading || !!taxIdError}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? '建立' : '儲存'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
