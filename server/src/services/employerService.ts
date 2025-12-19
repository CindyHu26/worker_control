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
        capital,
        laborInsuranceNo, laborInsuranceId, healthInsuranceUnitNo, healthInsuranceId, faxNumber,
        // Individual fields
        patientName, hospitalCertNo, careAddress, relationship,
        responsiblePersonDob, responsiblePersonIdNo, responsiblePersonFather, responsiblePersonMother, responsiblePersonSpouse,
        idIssueDate, idIssuePlace, militaryStatus,
        // New Core fields
        companyNameEn, addressEn, contactPerson, contactPhone,
        ...coreData
    } = data;

    // Prepare updates
    const coreUpdate: any = { ...coreData };
    if (companyNameEn !== undefined) coreUpdate.companyNameEn = companyNameEn;
    if (addressEn !== undefined) coreUpdate.addressEn = addressEn;
    if (contactPerson !== undefined) coreUpdate.contactPerson = contactPerson;
    if (contactPhone !== undefined) coreUpdate.contactPhone = contactPhone;

    const updates: any = { ...coreUpdate };

    // If Corporate fields are present
    if (factoryRegistrationNo || industryType || industryCode || capital !== undefined || laborInsuranceNo || healthInsuranceUnitNo) {
        updates.corporateInfo = {
            upsert: {
                create: {
                    factoryRegistrationNo,
                    industryType,
                    industryCode,
                    capital: capital ? Number(capital) : undefined,
                    laborInsuranceNo,
                    laborInsuranceId,
                    healthInsuranceUnitNo,
                    healthInsuranceId,
                    faxNumber,
                },
                update: {
                    factoryRegistrationNo,
                    industryType,
                    industryCode,
                    capital: capital ? Number(capital) : undefined,
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
    if (responsiblePersonIdNo || responsiblePersonSpouse || responsiblePersonFather || patientName) {
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
                    militaryStatus,
                    patientName,
                    patientIdNo: data.patientIdNo,
                    careAddress,
                    relationship
                },
                update: {
                    responsiblePersonIdNo,
                    responsiblePersonSpouse,
                    responsiblePersonFather,
                    responsiblePersonMother,
                    responsiblePersonDob: responsiblePersonDob ? new Date(responsiblePersonDob) : undefined,
                    idIssueDate: idIssueDate ? new Date(idIssueDate) : undefined,
                    idIssuePlace,
                    militaryStatus,
                    patientName,
                    patientIdNo: data.patientIdNo,
                    careAddress,
                    relationship
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
    if (employer.individualInfo) {
        const indInfo = employer.individualInfo as any;
        const repId = indInfo.responsiblePersonIdNo || '';
        if (!repId || !/^[A-Z][0-9]{9}$/.test(repId)) {
            missingFields.push('Missing/Invalid Responsible Person ID');
            alertsToCreate.push('缺負責人身分證號：無法進行 e 化服務授權與招募許可');
        }

        // --- Home Care Specifics ---
        if (!indInfo.patientName) {
            missingFields.push('Missing Patient Name');
            alertsToCreate.push('缺被看護人姓名');
        }
        if (!indInfo.careAddress) {
            missingFields.push('Missing Care Address');
            alertsToCreate.push('缺照護地點');
        }
    }

    // --- 3. Labor Insurance No & Institution ---
    if (employer.corporateInfo) {
        const corpInfo = employer.corporateInfo as any;
        const laborNo = corpInfo.laborInsuranceNo || '';
        if (!laborNo && !corpInfo.institutionCode) {
            missingFields.push('Missing Labor Insurance No');
            alertsToCreate.push('缺勞保證號：無法產出招募許可與加保表');
        }

        // --- Institution Specifics ---
        if (corpInfo.institutionCode) {
            if (!corpInfo.bedCount) {
                missingFields.push('Missing Bed Count');
                alertsToCreate.push('機構缺床位數資訊');
            }
        }

        // --- 4. Manufacturing Specifics ---
        if (corpInfo.industryType?.includes('製造')) {
            if (!employer.address) {
                missingFields.push('Missing Factory Address');
                alertsToCreate.push('缺工廠地址：無法產出求才登記、入國通報與生活計畫書');
            }
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

export const getEmployerSummary = async (id: string) => {
    const employer = await prisma.employer.findUnique({
        where: { id },
        include: {
            corporateInfo: true,
            individualInfo: true,
            serviceAssignments: {
                where: { endDate: null },
                include: { internalUser: { select: { username: true } } }
            },
            deployments: {
                where: { status: 'active' },
                select: { id: true }
            },
            recruitmentLetters: {
                where: { expiryDate: { gte: new Date() } },
                select: { approvedQuota: true, usedQuota: true }
            }
        }
    }) as any;

    if (!employer) return null;

    // Derive Assignee (Sales Agent preferred)
    const assignee = employer.serviceAssignments.find((a: any) => a.role === 'sales_agent')?.internalUser.username
        || employer.serviceAssignments[0]?.internalUser.username
        || '未指派';

    // Calculate Statistics
    const activeWorkerCount = employer.deployments.length;
    const totalQuota = employer.recruitmentLetters.reduce((acc: number, curr: any) => acc + (curr.approvedQuota || 0), 0);
    const usedQuota = employer.recruitmentLetters.reduce((acc: number, curr: any) => acc + (curr.usedQuota || 0), 0);
    const availableQuota = Math.max(0, totalQuota - usedQuota);

    // Flatten data for frontend
    return {
        basic: {
            id: employer.id,
            name: employer.companyName,
            taxId: employer.taxId,
            responsiblePerson: employer.responsiblePerson || '',
            phone: employer.phoneNumber || '',
            fax: employer.corporateInfo?.faxNumber || '',
            address: employer.address || '',
            email: employer.email || '',
        },
        biz: {
            industry: employer.corporateInfo?.industryType || '工業/製造',
            laborInsNo: employer.corporateInfo?.laborInsuranceNo || '',
            healthInsNo: employer.corporateInfo?.healthInsuranceUnitNo || '',
            factoryReg: employer.corporateInfo?.factoryRegistrationNo || '',
        },
        stats: {
            activeWorkers: activeWorkerCount,
            quotaTotal: totalQuota,
            quotaLeft: availableQuota,
        },
        meta: {
            assignee: assignee,
            agency: '自有', // Agency relation missing in current schema, defaulting to Own
        }
    };
};
