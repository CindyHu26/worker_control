import prisma from '../prisma';

/**
 * Calculate 3K5 Quota with proper rounding rules
 * Rule: 小數點後第一位應大於零並採無條件進位，小數點後第二位以下則採四捨五入
 * Translation: If first decimal digit > 0, use ceiling; for second decimal onwards, use standard rounding
 * 
 * @param laborCount Average domestic worker count
 * @param allocationRate Allocation rate (0.10 to 0.35)
 * @returns Calculated quota
 */
export const calculate3K5Quota = (laborCount: number, allocationRate: number): number => {
    const raw = laborCount * allocationRate;

    // If exact integer, return as-is
    if (raw === Math.floor(raw)) {
        return raw;
    }

    // Extract first decimal digit
    const firstDecimal = Math.floor((raw * 10) % 10);

    // If first decimal > 0, round up (ceiling)
    if (firstDecimal > 0) {
        return Math.ceil(raw);
    }

    // Otherwise floor (though this case shouldn't happen if first decimal is checked)
    return Math.floor(raw);
};

/**
 * Map industry code to category enum (strict validation)
 * @param industryCode Standard industry code (01, 02, 06, 08, etc.)
 * @returns Category string
 * @throws Error if industry code is not recognized
 */
export const mapIndustryCodeToCategory = (industryCode: string): string => {
    const mapping: Record<string, string> = {
        '01': 'MANUFACTURING',
        '02': 'CONSTRUCTION',
        '03': 'FISHERY',
        '04': 'AGRICULTURE',
        '05': 'SLAUGHTER',
        '06': 'HOME_CARE',
        '07': 'HOME_HELPER',
        '08': 'INSTITUTION',
        '09': 'OUTREACH_AGRICULTURE',
        '10': 'HOSPITALITY',
        '99': 'OTHER'
    };

    if (!mapping[industryCode]) {
        throw new Error(`Invalid industry code: ${industryCode}. Expected: 01-10, 99.`);
    }

    return mapping[industryCode];
};

/**
 * Map category enum to industry code (reverse mapping for frontend)
 * @param category Industry category enum (MANUFACTURING, CONSTRUCTION, etc.)
 * @returns Industry code string
 */
export const mapCategoryToIndustryCode = (category: string): string => {
    const reverseMapping: Record<string, string> = {
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

    return reverseMapping[category] || '01'; // Safe fallback for display
};

/**
 * Converts a Lead to an Employer
 * @param leadId 
 * @param operatorId Internal User ID performing the action
 * @param options Conversion data with enhanced validation
 */
/**
 * Converts a Lead to an Employer
 * @param leadId 
 * @param operatorId Internal User ID performing the action
 * @param options Conversion data with enhanced validation
 */
export const convertLeadToEmployer = async (
    leadId: string,
    operatorId: string,
    options: {
        taxId: string;                    // Required
        industryCode?: string;            // Optional: '01', '02', '06', '08'
        industryType?: string;            // Optional: MANUFACTURING, etc.
        invoiceAddress?: string;          // Company registration address
        factoryAddress?: string;          // Factory address (required for manufacturing)
        avgDomesticWorkers?: number;      // Domestic worker count (required for manufacturing)
        allocationRate?: number;          // Allocation rate (required for manufacturing)
        isExtra?: boolean;                // Whether extra 5% is applied
        complianceStandard?: string;      // NONE, RBA_7_0, RBA_8_0, IWAY_6_0, SA8000
        zeroFeeEffectiveDate?: Date;      // When zero-fee rules take effect
    }
) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Lead
        const lead = await tx.lead.findUnique({ where: { id: leadId } });
        if (!lead) throw new Error("Lead not found");
        if (lead.status === 'WON') throw new Error("Lead already converted");

        // 2. Determine Industry Category
        let category: string;
        let industryCode: string | undefined;

        if (options.industryCode) {
            industryCode = options.industryCode;
            category = mapIndustryCodeToCategory(industryCode);
        } else if (options.industryType) {
            category = options.industryType;
            industryCode = mapCategoryToIndustryCode(category);
        } else {
            category = "MANUFACTURING";
            industryCode = "01";
        }

        // 3. Branched Validation
        if (category === 'MANUFACTURING') {
            if (!options.factoryAddress) throw new Error("製造業轉正必須填寫：工廠地址");
            if (!options.avgDomesticWorkers) throw new Error("製造業轉正必須填寫：國內勞工人數");
            if (!options.allocationRate) throw new Error("製造業轉正必須填寫：核配比率");

            // Strict Tier Validation
            const validTiers = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40];
            if (!validTiers.includes(Number(options.allocationRate.toFixed(2)))) {
                throw new Error(`無效的核配比率: ${options.allocationRate}. 合法級距為: ${validTiers.join(', ')}`);
            }
        }

        // 4. Create Employer with Nested CorporateInfo
        const employer = await tx.employer.create({
            data: {
                companyName: lead.companyName || "Unknown Company",
                taxId: options.taxId,
                phoneNumber: lead.phone,
                email: lead.email,
                responsiblePerson: lead.contactPerson,
                address: options.invoiceAddress || lead.address || '',
                invoiceAddress: options.invoiceAddress || lead.address || '',

                // Track Source
                // originLeadId: lead.id, // Removed: Relation follows Lead.convertedToEmployerId

                createdBy: operatorId,
                allocationRate: options.allocationRate || null,
                complianceStandard: options.complianceStandard || 'NONE',
                zeroFeeEffectiveDate: options.zeroFeeEffectiveDate || null,
                industryAttributes: {
                    isExtra: options.isExtra || false
                },

                // Nested CorporateInfo Relation
                corporateInfo: (category === 'MANUFACTURING' || category === 'INSTITUTION') ? {
                    create: {
                        industryType: category,
                        industryCode: industryCode,
                        factoryAddress: options.factoryAddress,
                    }
                } : undefined,

                // For Individual Info, we might need to handle later or assume category logic
            }
        });

        // 5. Initialize Labor Count (Quota Basis) - Only for Manufacturing
        if (category === 'MANUFACTURING' && options.avgDomesticWorkers && options.avgDomesticWorkers > 0) {
            const now = new Date();
            await tx.employerLaborCount.create({
                data: {
                    employerId: employer.id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    count: options.avgDomesticWorkers
                }
            });
        }

        // 6. Update Lead Status and Link
        await tx.lead.update({
            where: { id: leadId },
            data: {
                status: 'WON',
                convertedToEmployerId: employer.id, // Link back to created employer
            }
        });

        // 7. System Comment
        let quotaInfo = '';
        if (category === 'MANUFACTURING' && options.avgDomesticWorkers && options.allocationRate) {
            const calculatedQuota = calculate3K5Quota(options.avgDomesticWorkers, options.allocationRate);
            quotaInfo = ` | 3K5 Quota: ${options.avgDomesticWorkers} × ${options.allocationRate * 100}% = ${calculatedQuota} people`;
        }

        await tx.systemComment.create({
            data: {
                content: `Created from Lead: ${lead.companyName} (Lead ID: ${leadId})${quotaInfo}`,
                recordId: employer.id,
                recordTableName: 'Employer',
                createdBy: operatorId
            }
        });

        return employer;
    });
};
