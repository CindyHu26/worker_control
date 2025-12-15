import prisma from '../prisma';

/**
 * Converts a Lead to an Employer
 * @param leadId 
 * @param operatorId Internal User ID performing the action
 */
export const convertLeadToEmployer = async (leadId: string, operatorId: string) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch Lead
        const lead = await tx.lead.findUnique({
            where: { id: leadId }
        });

        if (!lead) throw new Error("Lead not found");
        if (lead.status === 'WON') throw new Error("Lead already converted");

        // 2. Create Employer
        // Map fields: companyName -> companyName, etc.
        // We need a unique taxId. If Lead doesn't have it (it's not in schema), we might need to generate a placeholder or ask user to fill it later.
        // The schema for Employer REQUIRES taxId (@unique).
        // Lead data is loose. 
        // Strategy: Use a placeholder TAX ID (e.g. "TEMP-{timestamp}") if not provided?
        // Wait, Lead schema does not have taxId. 
        // We will generate a temporary Tax ID so the creation succeeds, and User must update it.
        const tempTaxId = `T${Date.now()}`;

        const employer = await tx.employer.create({
            data: {
                companyName: lead.companyName || "Unknown Company",
                taxId: tempTaxId,
                phoneNumber: lead.phone,
                email: lead.email,
                responsiblePerson: lead.contactPerson,
                address: lead.address,
                industryType: lead.industry,
                // createdBy: operatorId // optional if schema supports it
                createdBy: operatorId
            }
        });

        // 3. Update Lead Status
        await tx.lead.update({
            where: { id: leadId },
            data: { status: 'WON' }
        });

        // 4. (Optional) Create a System Comment on Employer linking back
        await tx.systemComment.create({
            data: {
                content: `Created from Lead: ${lead.companyName} (Lead ID: ${leadId})`,
                recordId: employer.id,
                recordTableName: 'Employer',
                createdBy: operatorId
            }
        });

        return employer;
    });
};
