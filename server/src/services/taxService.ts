
import prisma from '../prisma';
import type { Prisma } from '@prisma/client';

export type ResidencyStatusResult = {
    year: number;
    stayDays: number;
    status: 'RESIDENT' | 'NON_RESIDENT';
    isApproaching: boolean;
};

export type TaxLiabilityResult = {
    year: number;
    status: 'RESIDENT' | 'NON_RESIDENT';
    totalIncome: number;
    totalWithheld: number;
    taxDue: number;
    refundAmount: number; // If positive, refund. If negative, need to pay? Or just refund is >0 if overpaid.
    balance: number; // Positive = Payable, Negative = Refundable
    details: string[];
};

// Helper: Get Tax Parameters
const getTaxParams = (year: number) => {
    // Simplified for 2024-2025
    if (year >= 2024) {
        return {
            minWage: 27470, // 2024
            minWageThresholdMultipler: 1.5,
            standardDeduction: 124000,
            salaryDeduction: 207000,
            personalExemption: 92000,
            taxRateResident: 0.05,
            nonResidentLowRate: 0.06,
            nonResidentHighRate: 0.18
        };
    }
    // Fallback/Older
    return {
        minWage: 26400,
        minWageThresholdMultipler: 1.5,
        standardDeduction: 124000,
        salaryDeduction: 207000,
        personalExemption: 92000,
        taxRateResident: 0.05,
        nonResidentLowRate: 0.06,
        nonResidentHighRate: 0.18
    };
};

export const calculateResidencyStatus = async (workerId: string, year: number): Promise<ResidencyStatusResult> => {
    // 1. Fetch Deployments active in this year
    const startOfYear = new Date(Date.UTC(year, 0, 1));
    const endOfYear = new Date(Date.UTC(year, 11, 31));

    const deployments = await prisma.deployment.findMany({
        where: {
            workerId,
            // Overlap with year
            // (start <= endOfYear) AND (end >= startOfYear OR end is null)
            entryDate: {
                not: null,
                lte: endOfYear
            },
            OR: [
                { endDate: null },
                { endDate: { gte: startOfYear } }
            ]
        }
    });

    let totalDays = 0;

    for (const d of deployments) {
        if (!d.entryDate) continue;

        // Calculate overlap interval
        const rangeStart = d.entryDate < startOfYear ? startOfYear : d.entryDate;

        // Determining rangeEnd
        let rangeEnd = endOfYear;
        if (d.endDate && d.endDate < endOfYear) {
            rangeEnd = d.endDate;
        } else if (!d.endDate) {
            // Active, assume up to 'now' if year is current, or endOfYear if year is past?
            // Usually tax assumes presence until proven otherwise if active. 
            // If year is CURRENT year, max days is up to Today? 
            // Standard practice: Count actual days passed if current year, or projected?
            // "183 rule" is for the Whole Year.
            // If evaluating mid-year, we count "Days so far".
            const today = new Date();
            if (year === today.getFullYear()) {
                rangeEnd = today < rangeEnd ? today : rangeEnd;
            }
        }

        if (rangeEnd >= rangeStart) {
            const diffTime = Math.abs(rangeEnd.getTime() - rangeStart.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
            totalDays += diffDays;
        }
    }

    const status = totalDays >= 183 ? 'RESIDENT' : 'NON_RESIDENT';
    const isApproaching = totalDays >= 170 && totalDays < 183;

    return { year, stayDays: totalDays, status, isApproaching };
};

export const calculateTaxLiability = async (workerId: string, year: number): Promise<TaxLiabilityResult> => {
    // 1. Determine Residency
    const residency = await calculateResidencyStatus(workerId, year);
    const params = getTaxParams(year);
    const minWageLimit = params.minWage * params.minWageThresholdMultipler;

    // 2. Fetch Payroll Records
    // We base tax on "Pay Date" falling within the year
    const payrolls = await prisma.payrollRecord.findMany({
        where: {
            workerId,
            payDate: {
                gte: new Date(Date.UTC(year, 0, 1)),
                lte: new Date(Date.UTC(year, 11, 31))
            }
        }
    });

    let totalIncome = 0;
    let totalWithheld = 0;
    let taxDue = 0;
    const details: string[] = [];

    // 3. Calculation
    if (residency.status === 'NON_RESIDENT') {
        // Non-Resident: Final Withholding Separation Taxation (usually)
        // Check each month/payment independently? 
        // Logic: For each payment, check if it exceeded threshold and if correct rate was applied.
        // Sum up "Theoretical Tax" for each record.

        for (const p of payrolls) {
            const income = Number(p.salaryAmount) + Number(p.bonusAmount);
            totalIncome += income;
            totalWithheld += Number(p.taxWithheld);

            // Theoretical Tax
            // If Income <= 1.5 * MinWage -> 6%
            // Else -> 18%
            const rate = income <= minWageLimit ? params.nonResidentLowRate : params.nonResidentHighRate;
            const expectedTax = Math.floor(income * rate); // Floor is standard
            taxDue += expectedTax;

            if (expectedTax !== Number(p.taxWithheld)) {
                details.push(`PayDate ${p.payDate.toISOString().slice(0, 10)}: Income ${income}, Expected ${expectedTax} (${rate * 100}%), Paid ${p.taxWithheld}`);
            }
        }

    } else {
        // Resident: Consolidated Income Tax
        payrolls.forEach((p: typeof payrolls[number]) => {
            totalIncome += (Number(p.salaryAmount) + Number(p.bonusAmount));
            totalWithheld += Number(p.taxWithheld);
        });

        // Net Income = Gross - Exemptions - Deductions
        // Simple formula for logic
        let netIncome = totalIncome
            - params.personalExemption
            - params.standardDeduction
            - params.salaryDeduction; // Cap checks skipped for brevity, keeping logic simple

        if (netIncome < 0) netIncome = 0;

        // Validating Deductions logic: Salary Deduction usually capped at salary or 207k.
        // Actually: min(TotalSal, 207000).
        // Let's refine
        const actualSalaryDed = Math.min(totalIncome, params.salaryDeduction);
        netIncome = totalIncome - params.personalExemption - params.standardDeduction - actualSalaryDed;
        if (netIncome < 0) netIncome = 0;

        // Tax Calculation (5% basic bracket, simplified)
        // If income very high, progressive rates apply. Migrant workers usually in 5%.
        // 0 - 560,000 -> 5%
        taxDue = Math.floor(netIncome * params.taxRateResident);
    }

    const balance = taxDue - totalWithheld; // > 0 means Pay More, < 0 means Refund
    const refundAmount = balance < 0 ? Math.abs(balance) : 0;

    return {
        year,
        status: residency.status,
        totalIncome,
        totalWithheld,
        taxDue,
        refundAmount,
        balance,
        details
    };
};
