"use client";

import React from 'react';
import { AlertCircle, Shield, CheckCircle2 } from 'lucide-react';

export type ComplianceStandard = 'NONE' | 'RBA_7_0' | 'RBA_8_0' | 'IWAY_6_0' | 'SA8000';

interface ComplianceSelectorProps {
    value: string;
    onChange: (value: ComplianceStandard) => void;
    effectiveDate?: string;
    onEffectiveDateChange?: (date: string) => void;
}

const COMPLIANCE_OPTIONS = [
    { value: 'NONE', label: '僅台灣法規 (Standard MOL)', description: '一般工廠適用' },
    { value: 'RBA_7_0', label: 'RBA 7.0', description: '責任商業聯盟 - 完全零付費' },
    { value: 'RBA_8_0', label: 'RBA 8.0', description: '責任商業聯盟 (最新版) - 完全零付費' },
    { value: 'IWAY_6_0', label: 'IKEA IWAY 6.0', description: 'IKEA 供應商標準' },
    { value: 'SA8000', label: 'SA8000', description: '社會責任國際標準' }
];

export default function ComplianceSelector({
    value,
    onChange,
    effectiveDate,
    onEffectiveDateChange
}: ComplianceSelectorProps) {
    const selectedOption = COMPLIANCE_OPTIONS.find(opt => opt.value === value);
    const isStrictStandard = value !== 'NONE';

    return (
        <div className="space-y-4">
            {/* Selector */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Shield size={16} className="text-blue-600" />
                    企業社會責任 / 稽核標準 (CSR/ESG Compliance)
                </label>
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value as ComplianceStandard)}
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                    {COMPLIANCE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                        </option>
                    ))}
                </select>
            </div>

            {/* Warning Alert for Strict Standards */}
            {isStrictStandard && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                    <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-amber-800 text-sm mb-1">
                                ⚠️ 嚴格稽核標準已啟用
                            </h4>
                            <p className="text-sm text-amber-700 mb-2">
                                選擇此標準後，系統將自動限制以下費用項目：
                            </p>
                            <ul className="text-xs text-amber-700 space-y-1 ml-4 list-disc">
                                <li><strong>禁止向移工收取</strong>：服務費、仲介費、機票、簽證、體檢、護照費</li>
                                <li><strong>禁止扣款</strong>：制服費、識別證費、訓練費</li>
                                <li><strong>所有招募費用必須由雇主負擔</strong></li>
                                <li className="text-red-600 font-semibold">違規後果：失去客戶訂單或供應商資格</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Effective Date */}
            {isStrictStandard && onEffectiveDateChange && (
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        零付費生效日期 (Zero-Fee Effective Date)
                    </label>
                    <input
                        type="date"
                        value={effectiveDate || ''}
                        onChange={(e) => onEffectiveDateChange(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        此日期之前的合約不受零付費限制（舊約保護）
                    </p>
                </div>
            )}

            {/* Success Message for NONE */}
            {value === 'NONE' && (
                <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded flex items-start gap-2">
                    <CheckCircle2 size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-700">
                        適用台灣勞動部標準法規，允許合理服務費收取
                    </p>
                </div>
            )}
        </div>
    );
}
