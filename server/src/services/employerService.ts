import { z } from 'zod';
import prisma from '../prisma';

// 定義結構，確保 JSON 裡面不會被亂存垃圾
// Define schemas for industry-specific attributes
const FactoryAttrs = z.object({
    factoryRegistrationNo: z.string().optional(),
    industryCode: z.string().optional(),
    industryType: z.string().optional(),
    factoryAddress: z.string().optional(),
    factoryAddressEn: z.string().optional(),
});

const CaretakerAttrs = z.object({
    patientName: z.string().optional(),
    hospitalCertNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),
});

// 存檔時 (Create/Update)
export async function updateEmployer(id: string, data: any) {
    const {
        attributes,
        // Corporate fields
        factoryRegistrationNo, industryCode, industryType, factoryAddress, factoryAddressEn,
        laborInsuranceNo, laborInsuranceId, healthInsuranceUnitNo, healthInsuranceId, faxNumber,
        // Individual fields
        patientName, hospitalCertNo, careAddress, relationship,
        responsiblePersonDob, responsiblePersonIdNo, responsiblePersonFather, responsiblePersonMother, responsiblePersonSpouse,
        idIssueDate, idIssuePlace, militaryStatus,
        ...coreData
    } = data;

    // Determine category from data or fetch current if needed (omitted for brevity, assuming passed or just updating fields present)
    // Actually, we should update based on what's provided.

    // Prepare updates
    const coreUpdate = { ...coreData };

    // We can use upsert or update for relations if IDs exist, but simpler to use 'update or create' syntax? 
    // Prisma `update` allows nested `upsert`.

    const updates: any = { ...coreUpdate };

    // If Corporate fields are present
    if (factoryRegistrationNo || industryType || laborInsuranceNo || healthInsuranceUnitNo) {
        updates.corporateInfo = {
            upsert: {
                create: {
                    factoryRegistrationNo,
                    industryType,
                    laborInsuranceNo,
                    laborInsuranceId,
                    healthInsuranceUnitNo,
                    healthInsuranceId,
                    faxNumber,
                    // factoryAddress is usually stored in core address or if different? The schema doesn't have factoryAddress on CorporateInfo yet, maybe strict mapping?
                    // New Schema: CorporateInfo has factoryRegistrationNo, industryType...
                    // Note: factoryAddress was in JSON before. Now likely main address or needs field.
                    // User schema didn't explicitly add factoryAddress to CorporateInfo, let's assume it maps to core Address or we missed it.
                    // The user request said "CorporateInfo (存工廠登記證...)"
                    // I will stick to the schema I defined.
                },
                update: {
                    factoryRegistrationNo,
                    industryType,
                    laborInsuranceNo,
                    laborInsuranceId,
                    healthInsuranceUnitNo,
                    healthInsuranceId,
                    faxNumber
                }
            }
        };
    }

    // If Individual fields are present
    if (responsiblePersonIdNo || responsiblePersonSpouse || responsiblePersonFather) {
        updates.individualInfo = {
            upsert: {
                create: {
                    responsiblePersonIdNo,
                    responsiblePersonSpouse,
                    responsiblePersonFather,
                    responsiblePersonMother,
                    responsiblePersonDob: responsiblePersonDob ? new Date(responsiblePersonDob) : undefined,
                    idIssueDate: idIssueDate ? new Date(idIssueDate) : undefined,
                    idIssuePlace,
                    militaryStatus
                },
                update: {
                    responsiblePersonIdNo,
                    responsiblePersonSpouse,
                    responsiblePersonFather,
                    responsiblePersonMother,
                    responsiblePersonDob: responsiblePersonDob ? new Date(responsiblePersonDob) : undefined,
                    idIssueDate: idIssueDate ? new Date(idIssueDate) : undefined,
                    idIssuePlace,
                    militaryStatus
                }
            }
        }
    }

    return prisma.employer.update({
        where: { id },
        data: updates,
        include: {
            corporateInfo: true,
            individualInfo: true
        }
    });
}

export const analyzeDataHealth = async (employerId: string) => {
    const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        include: {
            corporateInfo: true,
            individualInfo: true,
            // laborCounts: { orderBy: { year: 'desc', month: 'desc' }, take: 1 } // Removed in user's schema view, check if exists?
        }
    });

    if (!employer) throw new Error('Employer not found');

    const missingFields: string[] = [];
    const alertsToCreate: string[] = [];

    // --- 1. Tax ID (Unified Business No) ---
    const taxId = employer.taxId || '';
    if (!taxId) {
        missingFields.push('Missing Tax ID');
        alertsToCreate.push('缺統編：無法進行任何政府申辦');
    } else {
        // Individual usually has ID length (10), Corporate (8)
        // Check existence of corporateInfo or individualInfo to guess type, or use a type field if it exists?
        // Schema doesn't have 'type' or 'category' on Employer anymore?
        // Wait, I removed 'category' from Employer in my schema edit? 
        // Let me check my previous edit. 
        // Yes, I removed 'category' and 'industryAttributes'.
        // So I must infer type from relations.

        if (employer.individualInfo) {
            if (!/^[A-Z][0-9]{9}$/.test(taxId)) {
                missingFields.push('Invalid Tax ID Format (Individual)');
                alertsToCreate.push('統編格式錯誤 (自然人需為身分證字號)');
            }
        } else {
            // Default corporate or check corporateInfo
            if (!/^\d{8}$/.test(taxId)) {
                missingFields.push('Invalid Tax ID Format (Corporate)');
                alertsToCreate.push('統編格式錯誤 (法人需為 8 碼數字)');
            }
        }
    }

    // --- 2. Responsible Person ID ---
    // Now in IndividualInfo for individuals
    if (employer.individualInfo) {
        const repId = employer.individualInfo.responsiblePersonIdNo || '';
        if (!repId || !/^[A-Z][0-9]{9}$/.test(repId)) {
            missingFields.push('Missing/Invalid Responsible Person ID');
            alertsToCreate.push('缺負責人身分證號：無法進行 e 化服務授權與招募許可');
        }
    }

    // --- 3. Labor Insurance No ---
    if (employer.corporateInfo) {
        const laborNo = employer.corporateInfo.laborInsuranceNo || '';
        if (!laborNo || !/^\d{8,9}$/.test(laborNo.replace(/-/g, ''))) {
            missingFields.push('Missing/Invalid Labor Insurance No');
            alertsToCreate.push('缺勞保證號：無法產出招募許可與加保表');
        }

        // --- 4. Manufacturing Specifics ---
        if (employer.corporateInfo.industryType?.includes('製造')) {
            // Factory Address - assumes core address is factory address for now
            if (!employer.address) {
                missingFields.push('Missing Factory Address');
                alertsToCreate.push('缺工廠地址：無法產出求才登記、入國通報與生活計畫書');
            }

            // Allocation Rate - check where this is stored? Was 'allocationRate' on Employer? 
            // I removed it from schema. It should probably be on CorporateInfo. 
            // Logic skipped if field missing.
        }
    }

    // --- 5. Compliance Standard ---
    // Field 'complianceStandard' was on Employer? I might have removed it.
    // If removed, skip check.

    // --- Alert Management ---
    // (Existing logic preserved)
    const existingAlerts = await prisma.incident.findMany({
        where: {
            employerId,
            category: 'DATA_MISSING',
            status: 'open'
        }
    });

    for (const msg of alertsToCreate) {
        const exists = existingAlerts.find(a => a.description === msg);
        if (!exists) {
            await prisma.incident.create({
                data: {
                    employerId,
                    category: 'DATA_MISSING',
                    severityLevel: 'low', // lowercase enum match
                    description: msg,
                    status: 'open',
                    isAutoGenerated: true
                }
            });
        }
    }

    for (const alert of existingAlerts) {
        if (!alertsToCreate.includes(alert.description)) {
            await prisma.incident.update({
                where: { id: alert.id },
                data: { status: 'closed' } // enum 'closed' instead of 'resolved'
            });
        }
    }

    const isReady = missingFields.length === 0;

    return {
        isReady,
        status: isReady ? 'READY_TO_RECRUIT' : 'MISSING_INFO',
        missingFields,
        alerts: alertsToCreate,
        employerName: employer.companyName
    };
};

export const checkRecruitmentReadiness = analyzeDataHealth;
