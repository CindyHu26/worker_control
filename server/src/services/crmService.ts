import prisma from '../prisma';

/**
 * Converts a Lead to an Employer
 * @param leadId 
 * @param operatorId Internal User ID performing the action
 * @param options Additional conversion data
 */
export const convertLeadToEmployer = async (
    leadId: string,
    operatorId: string,
    options?: {
        taxId?: string;
        industryType?: string; // Enum: MANUFACTURING, etc.
        factoryAddress?: string;
        avgDomesticWorkers?: number;
        allocationRate?: number;
        complianceStandard?: string; // NONE, RBA_7_0, RBA_8_0, IWAY_6_0, SA8000
        zeroFeeEffectiveDate?: Date; // When zero-fee rules take effect
    }
) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Lead
        const lead = await tx.lead.findUnique({
            where: { id: leadId }
        });

        if (!lead) throw new Error("Lead not found");
        if (lead.status === 'WON') throw new Error("Lead already converted");

        // 2. Prepare Data
        const taxId = options?.taxId || `T${Date.now()}`;
        const category = options?.industryType || "MANUFACTURING"; // Default to Manufacturing if not set
        const address = options?.factoryAddress || lead.address;

        // 3. Create Employer
        const employer = await tx.employer.create({
            data: {
                companyName: lead.companyName || "Unknown Company",
                taxId: taxId,
                phoneNumber: lead.phone,
                email: lead.email,
                responsiblePerson: lead.contactPerson,
                address: address,
                category: category,
                industryType: category, // Saving enum value as text description too for now
                createdBy: operatorId,
                allocationRate: options?.allocationRate ? options.allocationRate : undefined, // Save Allocation Rate
                complianceStandard: options?.complianceStandard || 'NONE', // Save Compliance Standard
                zeroFeeEffectiveDate: options?.zeroFeeEffectiveDate || null, // Save Zero-Fee Effective Date
                // Create Factory Info if address provided and is manufacturing
                factoryInfo: (category === 'MANUFACTURING') ? {
                    create: {
                        factoryAddress: address
                    }
                } : undefined
            }
        });

        // 4. Initialize Labor Count (Quota Basis) if provided
        if (options?.avgDomesticWorkers && options.avgDomesticWorkers > 0) {
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

        // 5. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: 'WON' }
        });

        // 6. Link Interaction History? 
        // (Optional: Copy interactions to SystemComments on Employer or link them if schema supported it. 
        // Currently LeadInteraction is tied to Lead. We can leave them there as trace.)

        // 7. System Comment
        await tx.systemComment.create({
            data: {
                content: `Created from Lead: ${lead.companyName} (Lead ID: ${leadId}). Initial Logic: 3K5 Quota Base = ${options?.avgDomesticWorkers || 0}`,
                recordId: employer.id,
                recordTableName: 'Employer',
                createdBy: operatorId
            }
        });

        return employer;
    });
};
