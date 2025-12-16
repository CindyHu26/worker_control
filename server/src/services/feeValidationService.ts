import prisma from '../prisma';

/**
 * Fee Compliance Validation Service
 * Handles dual-track compliance: Government (MOL) + Third-Party Audits (RBA/IWAY)
 */

export type ComplianceStandard = 'NONE' | 'RBA_7_0' | 'RBA_8_0' | 'IWAY_6_0' | 'SA8000';
export type PayerType = 'worker' | 'employer';

export interface FeeValidationResult {
    allowed: boolean;
    severity: 'ok' | 'warning' | 'error';
    message?: string;
    regulation?: string; // Which regulation was violated
}

/**
 * Validate if a fee can be charged based on employer's compliance standard
 */
export const validateFeeCompliance = async (
    employerId: string,
    feeItemId: string,
    payerType: PayerType,
    amount: number,
    billingDate?: Date
): Promise<FeeValidationResult> => {
    // 1. Fetch Employer with compliance info
    const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        select: {
            complianceStandard: true,
            zeroFeeEffectiveDate: true,
            category: true
        }
    });

    if (!employer) {
        return {
            allowed: false,
            severity: 'error',
            message: 'Employer not found'
        };
    }

    // 2. Fetch FeeItem details
    const feeItem = await prisma.feeItem.findUnique({
        where: { id: feeItemId },
        select: {
            name: true,
            category: true,
            isZeroFeeSubject: true,
            nationality: true
        }
    });

    if (!feeItem) {
        return {
            allowed: false,
            severity: 'error',
            message: 'Fee item not found'
        };
    }

    const standard = (employer.complianceStandard || 'NONE') as ComplianceStandard;
    const effectiveDate = employer.zeroFeeEffectiveDate;

    // 3. Check if zero-fee rules apply (based on effective date)
    const isZeroFeeActive = effectiveDate
        ? (billingDate || new Date()) >= new Date(effectiveDate)
        : true; // If no effective date set, rules apply immediately

    // 4. Apply compliance rules based on standard
    return applyComplianceRules(
        standard,
        payerType,
        feeItem,
        isZeroFeeActive,
        employer.category
    );
};

/**
 * Core rule engine - applies different rules per compliance standard
 */
function applyComplianceRules(
    standard: ComplianceStandard,
    payerType: PayerType,
    feeItem: { name: string; category: string; isZeroFeeSubject: boolean; nationality: string | null },
    isZeroFeeActive: boolean,
    employerCategory: string
): FeeValidationResult {

    // === NONE (Taiwan MOL Only) ===
    if (standard === 'NONE') {
        // Allow most fees, but check Indonesia-specific rules
        if (feeItem.nationality === 'ID' && payerType === 'worker') {
            if (feeItem.category === 'placement_fee' || feeItem.name.includes('機票')) {
                return {
                    allowed: false,
                    severity: 'warning',
                    message: '台印協議建議：印尼籍移工的機票與仲介費應由雇主負擔',
                    regulation: 'Taiwan-Indonesia Agreement'
                };
            }
        }

        // Standard Taiwan regulations - generally allow service fees
        return { allowed: true, severity: 'ok' };
    }

    // === RBA (Responsible Business Alliance) ===
    if (standard === 'RBA_7_0' || standard === 'RBA_8_0') {
        if (payerType === 'worker' && isZeroFeeActive) {
            // RBA: Workers cannot be charged ANY recruitment-related fees
            const prohibitedCategories = ['service_fee', 'placement_fee', 'official_fee'];
            const prohibitedKeywords = ['招募', '仲介', '服務費', '機票', '簽證', '體檢', '護照', '制服', '識別證'];

            if (prohibitedCategories.includes(feeItem.category)) {
                return {
                    allowed: false,
                    severity: 'error',
                    message: `RBA 規範禁止向移工收取 ${feeItem.name}`,
                    regulation: 'RBA Code of Conduct'
                };
            }

            // Check name for prohibited keywords
            if (prohibitedKeywords.some(keyword => feeItem.name.includes(keyword))) {
                return {
                    allowed: false,
                    severity: 'error',
                    message: `RBA 規範禁止向移工收取招募相關費用 (${feeItem.name})`,
                    regulation: 'RBA Code of Conduct - Zero Fee Policy'
                };
            }
        }

        // Employer can be charged
        return { allowed: true, severity: 'ok' };
    }

    // === IWAY (IKEA Standard) ===
    if (standard === 'IWAY_6_0') {
        if (payerType === 'worker' && isZeroFeeActive) {
            // IWAY similar to RBA but may have variations
            if (feeItem.isZeroFeeSubject) {
                return {
                    allowed: false,
                    severity: 'error',
                    message: `IWAY 規範禁止向移工收取 ${feeItem.name}`,
                    regulation: 'IWAY Standard - Forced Labor Prevention'
                };
            }
        }
        return { allowed: true, severity: 'ok' };
    }

    // === SA8000 ===
    if (standard === 'SA8000') {
        if (payerType === 'worker' && isZeroFeeActive && feeItem.isZeroFeeSubject) {
            return {
                allowed: false,
                severity: 'error',
                message: `SA8000 規範禁止向移工收取招募費用`,
                regulation: 'SA8000 Social Accountability Standard'
            };
        }
        return { allowed: true, severity: 'ok' };
    }

    // Default: allow
    return { allowed: true, severity: 'ok' };
}

/**
 * Get compliance rules summary for an employer
 */
export const getEmployerComplianceRules = async (employerId: string) => {
    const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        select: {
            companyName: true,
            complianceStandard: true,
            zeroFeeEffectiveDate: true,
            category: true
        }
    });

    if (!employer) {
        throw new Error('Employer not found');
    }

    const standard = (employer.complianceStandard || 'NONE') as ComplianceStandard;

    return {
        employerId,
        companyName: employer.companyName,
        standard,
        effectiveDate: employer.zeroFeeEffectiveDate,
        rules: getComplianceRulesDescription(standard),
        restrictions: getComplianceRestrictions(standard)
    };
};

function getComplianceRulesDescription(standard: ComplianceStandard): string {
    const descriptions = {
        'NONE': '僅需符合台灣勞動部法規',
        'RBA_7_0': 'RBA 7.0 責任商業聯盟行為準則 - 完全零付費政策',
        'RBA_8_0': 'RBA 8.0 責任商業聯盟行為準則 - 完全零付費政策',
        'IWAY_6_0': 'IKEA IWAY 6.0 供應商行為準則',
        'SA8000': 'SA8000 社會責任標準'
    };
    return descriptions[standard];
}

function getComplianceRestrictions(standard: ComplianceStandard): string[] {
    if (standard === 'NONE') {
        return ['允許向移工收取合理服務費 (依台灣法規)', '印尼籍移工建議雇主負擔仲介費'];
    }

    const rbaRestrictions = [
        '禁止向移工收取任何招募費用 (服務費、仲介費)',
        '禁止向移工收取簽證、機票、體檢、護照費用',
        '禁止扣除制服費、識別證費、訓練費',
        '所有招募相關費用須由雇主負擔',
        '違規後果：失去客戶訂單或供應商資格'
    ];

    if (standard === 'RBA_7_0' || standard === 'RBA_8_0') {
        return rbaRestrictions;
    }

    if (standard === 'IWAY_6_0') {
        return [
            '禁止向移工收取招募相關費用',
            '禁止強制勞動或債務束縛',
            '所有費用須由雇主負擔',
            '違規後果：取消供應商資格'
        ];
    }

    if (standard === 'SA8000') {
        return [
            '禁止向移工收取招募費用',
            '保障工人自由選擇就業',
            '違規後果：認證撤銷'
        ];
    }

    return [];
}
