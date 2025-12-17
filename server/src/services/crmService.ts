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
export const convertLeadToEmployer = async (
    leadId: string,
    operatorId: string,
    options: {
        taxId: string;                    // Required
        industryCode?: string;            // Optional: '01', '02', '06', '08' (will derive from industryType if not provided)
        industryType?: string;            // Optional: MANUFACTURING, etc. (for backward compatibility)
        invoiceAddress?: string;          // Company registration address
        factoryAddress?: string;          // Factory address (required for manufacturing)
        avgDomesticWorkers?: number;      // Domestic worker count (required for manufacturing)
        allocationRate?: number;          // Allocation rate (required for manufacturing)
        complianceStandard?: string;      // NONE, RBA_7_0, RBA_8_0, IWAY_6_0, SA8000
        zeroFeeEffectiveDate?: Date;      // When zero-fee rules take effect
    }
) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Lead
        const lead = await tx.lead.findUnique({
            where: { id: leadId }
        });

        if (!lead) throw new Error("Lead not found");
        if (lead.status === 'WON') throw new Error("Lead already converted");

        // 2. Determine Industry Category
        let category: string;
        let industryCode: string | undefined;

        if (options.industryCode) {
            // Use industry code if provided
            industryCode = options.industryCode;
            category = mapIndustryCodeToCategory(industryCode);
        } else if (options.industryType) {
            // Fallback to industryType for backward compatibility
            category = options.industryType;
        } else {
            // Default
            category = "MANUFACTURING";
        }

        // 3. Validation for Manufacturing
        if (category === 'MANUFACTURING') {
            if (!options.factoryAddress) {
                throw new Error("Factory address is required for manufacturing employers");
            }
            if (!options.avgDomesticWorkers || options.avgDomesticWorkers <= 0) {
                throw new Error("Average domestic worker count is required for manufacturing employers");
            }
            if (!options.allocationRate) {
                throw new Error("Allocation rate is required for manufacturing employers");
            }
        }

        // 4. Prepare Addresses
        const invoiceAddress = options.invoiceAddress || lead.address || '';
        const factoryAddress = options.factoryAddress || invoiceAddress;

        // 5. Create Employer
        const employer = await tx.employer.create({
            data: {
                companyName: lead.companyName || "Unknown Company",
                taxId: options.taxId,
                phoneNumber: lead.phone,
                email: lead.email,
                responsiblePerson: lead.contactPerson,
                address: invoiceAddress,              // General address (company registration)
                invoiceAddress: invoiceAddress,       // Explicit invoice address
                category: category,
                industryType: category,
                industryCode: industryCode,           // Save industry code
                createdBy: operatorId,
                allocationRate: options.allocationRate || null,
                complianceStandard: options.complianceStandard || 'NONE',
                zeroFeeEffectiveDate: options.zeroFeeEffectiveDate || null,
                // Create Factory Info if manufacturing
                factoryInfo: (category === 'MANUFACTURING') ? {
                    create: {
                        factoryAddress: factoryAddress,
                        industryType: category
                    }
                } : undefined
            }
        });

        // 6. Initialize Labor Count (Quota Basis) if provided
        if (options.avgDomesticWorkers && options.avgDomesticWorkers > 0) {
            const now = new Date();
            await tx.employerLaborCount.create({
                data: {
                    employerId: employer.id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1, // 1-indexed
                    count: options.avgDomesticWorkers
                }
            });
        }

        // 7. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: 'WON' }
        });

        // 8. System Comment with Quota Calculation
        let quotaInfo = '';
        if (options.avgDomesticWorkers && options.allocationRate) {
            const calculatedQuota = calculate3K5Quota(options.avgDomesticWorkers, options.allocationRate);
            quotaInfo = ` | 3K5 Quota: ${options.avgDomesticWorkers} × ${options.allocationRate * 100}% = ${calculatedQuota} people`;
        }

        await tx.systemComment.create({
            data: {
                content: `Created from Lead: ${lead.companyName} (Lead ID: ${leadId})${lead.lineId ? ` | Line ID: ${lead.lineId}` : ''}${quotaInfo}`,
                recordId: employer.id,
                recordTableName: 'Employer',
                createdBy: operatorId
            }
        });

        return employer;
    });
};
