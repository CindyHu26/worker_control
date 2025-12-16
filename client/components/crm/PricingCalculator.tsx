"use client";

import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import ComplianceSelector, { ComplianceStandard } from '../employers/ComplianceSelector';

interface PricingCalculatorProps {
    defaultWorkerCount?: number;
    defaultNationality?: string;
    onCalculationChange?: (result: CalculationResult) => void;
}

interface CalculationResult {
    workerFees: number;
    employerFees: number;
    totalCost: number;
    profitMargin: number;
    warnings: string[];
}

export default function PricingCalculator({
    defaultWorkerCount = 10,
    defaultNationality = 'VN',
    onCalculationChange
}: PricingCalculatorProps) {
    const [workerCount, setWorkerCount] = useState(defaultWorkerCount);
    const [nationality, setNationality] = useState(defaultNationality);
    const [complianceStandard, setComplianceStandard] = useState<ComplianceStandard>('NONE');
    const [result, setResult] = useState<CalculationResult | null>(null);

    useEffect(() => {
        calculatePricing();
    }, [workerCount, nationality, complianceStandard]);

    const calculatePricing = () => {
        const isStrictCompliance = complianceStandard !== 'NONE';
        const warnings: string[] = [];

        // Base fees (monthly service fee per worker)
        const serviceFeeYear1 = 1800;
        const serviceFeeYear2 = 1700;
        const serviceFeeYear3 = 1500;
        const avgServiceFee = (serviceFeeYear1 + serviceFeeYear2 + serviceFeeYear3) / 3; // ~1667

        // One-time placement fees
        const placementFeePerWorker = 25000; // Example placement fee
        const airTicketPerWorker = 15000; // Flight cost
        const visaPerWorker = 3000;
        const medicalPerWorker = 2500;

        let workerChargedFees = 0;
        let employerChargedFees = 0;

        // === Scenario A: NONE (Taiwan MOL Only) ===
        if (!isStrictCompliance) {
            // Workers pay service fees (Monthly)
            workerChargedFees = avgServiceFee * workerCount;

            // Workers pay placement fees (One-time, amortized over 3 years for calculation)
            workerChargedFees += (placementFeePerWorker * workerCount) / 36; // Per month over 3 years

            // Indonesia-specific: Employer should pay airfare
            if (nationality === 'ID') {
                employerChargedFees = airTicketPerWorker * workerCount / 36; // Amortized
                warnings.push('台印協議：建議雇主負擔印尼籍移工的機票費用');
            } else {
                // Others: worker pays
                workerChargedFees += (airTicketPerWorker + visaPerWorker + medicalPerWorker) * workerCount / 36;
            }
        }

        // === Scenario B: RBA/IWAY (Strict Zero-Fee) ===
        else {
            // ALL recruitment fees go to employer
            const totalRecruitmentCostPerWorker = placementFeePerWorker + airTicketPerWorker + visaPerWorker + medicalPerWorker;

            // Employer pays ALL costs (amortized monthly)
            employerChargedFees = (
                avgServiceFee * workerCount + // Monthly service fee
                (totalRecruitmentCostPerWorker * workerCount) / 36 // One-time costs amortized
            );

            workerChargedFees = 0; // Workers pay NOTHING

            warnings.push(`${complianceStandard} 規範：所有招募費用由雇主負擔`);
            warnings.push('違規風險：失去客戶訂單或降級');
        }

        const totalCost = workerChargedFees + employerChargedFees;
        const revenue = totalCost; // Assuming we charge what it costs (can adjust)
        const costs = totalCost * 0.6; // Example: 60% of revenue is cost
        const profit = revenue - costs;
        const profitMargin = (profit / revenue) * 100;

        const calculationResult = {
            workerFees: Math.round(workerChargedFees),
            employerFees: Math.round(employerChargedFees),
            totalCost: Math.round(totalCost),
            profitMargin: Math.round(profitMargin),
            warnings
        };

        setResult(calculationResult);
        onCalculationChange?.(calculationResult);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                <Calculator size={24} className="text-blue-600" />
                <div>
                    <h3 className="font-bold text-slate-900">成本試算器 (Pricing Calculator)</h3>
                    <p className="text-xs text-slate-500">根據合規標準自動調整費用分配</p>
                </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        預計引進人數 (Worker Count)
                    </label>
                    <input
                        type="number"
                        value={workerCount}
                        onChange={(e) => setWorkerCount(parseInt(e.target.value) || 0)}
                        min={1}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        國籍 (Nationality)
                    </label>
                    <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                        <option value="VN">越南 (Vietnam)</option>
                        <option value="ID">印尼 (Indonesia)</option>
                        <option value="PH">菲律賓 (Philippines)</option>
                        <option value="TH">泰國 (Thailand)</option>
                    </select>
                </div>
            </div>

            {/* Compliance Selector */}
            <div className="pt-4 border-t border-slate-200">
                <ComplianceSelector
                    value={complianceStandard}
                    onChange={setComplianceStandard}
                />
            </div>

            {/* Results */}
            {result && (
                <div className="pt-4 border-t border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-600" />
                        試算結果 (Calculation Result)
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-1">向移工收費 (Worker Fees)</p>
                            <p className="text-2xl font-bold text-blue-900">
                                ${result.workerFees.toLocaleString()}
                                <span className="text-sm font-normal text-blue-600">/月</span>
                            </p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-xs text-green-700 font-medium mb-1">向雇主收費 (Employer Fees)</p>
                            <p className="text-2xl font-bold text-green-900">
                                ${result.employerFees.toLocaleString()}
                                <span className="text-sm font-normal text-green-600">/月</span>
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs text-slate-700 font-medium mb-1">總成本 (Total Cost)</p>
                            <p className="text-2xl font-bold text-slate-900">
                                ${result.totalCost.toLocaleString()}
                                <span className="text-sm font-normal text-slate-600">/月</span>
                            </p>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                            <p className="text-xs text-amber-700 font-medium mb-1">預估毛利率 (Margin)</p>
                            <p className="text-2xl font-bold text-amber-900">
                                {result.profitMargin}%
                            </p>
                        </div>
                    </div>

                    {/* Warnings */}
                    {result.warnings.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                            <div className="flex items-start gap-2">
                                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800 text-sm mb-2">注意事項</p>
                                    <ul className="text-xs text-amber-700 space-y-1">
                                        {result.warnings.map((warning, idx) => (
                                            <li key={idx}>• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
