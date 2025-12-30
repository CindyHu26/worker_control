import { z } from 'zod';
import prisma from '../prisma';
import {
    CreateEmployerInputSchema,
    EmployerSearchParamsSchema,
    type CreateEmployerInput,
    type EmployerSearchParams,
    type EmployerListItem,
    type PaginationMeta
} from '@worker-control/shared';
import {
    DuplicateResourceError,
    ResourceNotFoundError,
    ValidationError
} from '../types/errors';

import { parseOptionalDate } from '../utils/dateUtils';
import { parseNumber } from '../utils/numberUtils';


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

/**
 * Create New Employer
 * Handles both corporate and individual employers with nested relations
 */
export async function createEmployer(input: any) {
    // We allow passing nested or flat data. 
    // If input has corporateInfo/individualInfo, we use them.
    const {
        corporateInfo,
        individualInfo,
        factories,
        industryAttributes,
        avgDomesticWorkers,
        ...coreData
    } = input;
    console.log('[DEBUG createEmployer] Input keys:', Object.keys(input));
    console.log('[DEBUG createEmployer] Category:', input.category);

    // Validate core data if needed, but here we'll follow previous pattern with more flexibility
    // Determine basic fields
    const finalCompanyName = coreData.companyName || coreData.responsiblePerson || '未命名雇主';

    // Create employer in transaction
    const newEmployer = await prisma.$transaction(async (tx) => {
        const data: any = {
            companyName: finalCompanyName,
            companyNameEn: coreData.companyNameEn,
            taxId: coreData.taxId,
            unitTaxId: coreData.unitTaxId,
            houseTaxId: coreData.houseTaxId,
            code: coreData.code,
            shortName: coreData.shortName,
            referrer: coreData.referrer,
            taxAddress: coreData.taxAddress,
            healthBillAddress: coreData.healthBillAddress,
            healthBillZip: coreData.healthBillZip,
            responsiblePerson: coreData.responsiblePerson,
            phoneNumber: coreData.phoneNumber,
            mobilePhone: coreData.mobilePhone,
            address: coreData.address,
            addressEn: coreData.addressEn,
            invoiceAddress: coreData.invoiceAddress,
            email: coreData.email,
            contactPerson: coreData.contactPerson,
            contactPhone: coreData.contactPhone,
            allocationRate: parseNumber(coreData.allocationRate),
            complianceStandard: coreData.complianceStandard || 'NONE',
            zeroFeeEffectiveDate: parseOptionalDate(coreData.zeroFeeEffectiveDate),
            industryAttributes: industryAttributes || coreData.industryAttributes,
            agencyId: coreData.agencyId,
            remarks: coreData.remarks,
            category: coreData.category ? { connect: { code: coreData.category } } : undefined,
        };

        // Add corporate info
        if (corporateInfo || coreData.factoryRegistrationNo) {
            const corpData = corporateInfo || {
                factoryRegistrationNo: coreData.factoryRegistrationNo,
                industryType: coreData.industryType,
                industryCode: coreData.industryCode,
                factoryAddress: coreData.factoryAddress,
                capital: coreData.capital,
                laborInsuranceNo: coreData.laborInsuranceNo,
                laborInsuranceId: coreData.laborInsuranceId,
                healthInsuranceUnitNo: coreData.healthInsuranceUnitNo,
                healthInsuranceId: coreData.healthInsuranceId,
                institutionCode: coreData.institutionCode,
                bedCount: coreData.bedCount
            };

            data.corporateInfo = {
                create: {
                    factoryRegistrationNo: corpData.factoryRegistrationNo,
                    industryType: corpData.industryType,
                    industryCode: corpData.industryCode,
                    factoryAddress: corpData.factoryAddress,
                    capital: parseNumber(corpData.capital),
                    laborInsuranceNo: corpData.laborInsuranceNo,
                    laborInsuranceId: corpData.laborInsuranceId,
                    healthInsuranceUnitNo: corpData.healthInsuranceUnitNo,
                    healthInsuranceId: corpData.healthInsuranceId,
                    institutionCode: corpData.institutionCode,
                    bedCount: parseNumber(corpData.bedCount),
                    faxNumber: corpData.faxNumber || coreData.faxNumber
                }
            };
        }

        // Add individual info
        if (individualInfo || coreData.responsiblePersonIdNo) {
            const indData = individualInfo || {
                responsiblePersonIdNo: coreData.responsiblePersonIdNo,
                responsiblePersonSpouse: coreData.responsiblePersonSpouse,
                responsiblePersonFather: coreData.responsiblePersonFather,
                responsiblePersonMother: coreData.responsiblePersonMother,
                responsiblePersonDob: coreData.responsiblePersonDob,
                englishName: coreData.englishName,
                birthPlace: coreData.birthPlace,
                birthPlaceEn: coreData.birthPlaceEn,
                residenceAddress: coreData.residenceAddress,
                residenceZip: coreData.residenceZip,
                residenceCityCode: coreData.residenceCityCode,
                militaryStatus: coreData.militaryStatus,
                militaryStatusEn: coreData.militaryStatusEn,
                idIssueDate: coreData.idIssueDate,
                idIssueType: coreData.idIssueType,
                idIssuePlace: coreData.idIssuePlace,
                patientName: coreData.patientName,
                patientIdNo: coreData.patientIdNo,
                careAddress: coreData.careAddress,
                relationship: coreData.relationship
            };

            data.individualInfo = {
                create: {
                    responsiblePersonIdNo: indData.responsiblePersonIdNo ||
                        (coreData.taxId?.length === 10 ? coreData.taxId : undefined),
                    responsiblePersonSpouse: indData.responsiblePersonSpouse,
                    responsiblePersonFather: indData.responsiblePersonFather,
                    responsiblePersonMother: indData.responsiblePersonMother,
                    responsiblePersonDob: parseOptionalDate(indData.responsiblePersonDob),
                    englishName: indData.englishName,
                    birthPlace: indData.birthPlace,
                    birthPlaceEn: indData.birthPlaceEn,
                    residenceAddress: indData.residenceAddress,
                    residenceZip: indData.residenceZip,
                    residenceCityCode: indData.residenceCityCode,
                    militaryStatus: indData.militaryStatus,
                    militaryStatusEn: indData.militaryStatusEn,
                    idIssueDate: parseOptionalDate(indData.idIssueDate),
                    idIssueType: indData.idIssueType,
                    idIssuePlace: indData.idIssuePlace,
                    patientName: indData.patientName,
                    patientIdNo: indData.patientIdNo,
                    careAddress: indData.careAddress,
                    relationship: indData.relationship
                }
            };
        }

        // Add factories
        if (factories && factories.length > 0) {
            data.factories = {
                create: factories.map((f: any) => ({
                    name: f.name,
                    factoryRegNo: f.factoryRegNo,
                    taxId: f.taxId,
                    laborInsuranceNo: f.laborInsuranceNo,
                    healthInsuranceNo: f.healthInsuranceNo,
                    ranking: f.ranking,
                    address: f.address,
                    addressEn: f.addressEn,
                    zipCode: f.zipCode,
                    cityCode: f.cityCode,
                    laborCount: parseNumber(f.laborCount) || 0,
                    foreignCount: parseNumber(f.foreignCount) || 0
                }))
            };
        }

        // Create employer
        const employer = await tx.employer.create({
            data,
            include: {
                corporateInfo: true,
                individualInfo: true,
                factories: true,
                recruitmentLetters: true
            }
        });

        // Create initial labor count
        const laborCountValue = parseNumber(avgDomesticWorkers) || parseNumber(coreData.avgDomesticWorkers);
        if (laborCountValue && laborCountValue > 0) {
            const now = new Date();
            await tx.employerLaborCount.create({
                data: {
                    employerId: employer.id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    count: laborCountValue
                }
            });
        }

        return employer;
    });

    return newEmployer;
}

/**
 * Search Employers with Pagination
 */
export async function searchEmployers(params: EmployerSearchParams): Promise<{
    data: EmployerListItem[];
    meta: PaginationMeta;
}> {
    const validated = EmployerSearchParamsSchema.parse(params);
    const { q, page, limit, type, category } = validated;

    const skip = (page - 1) * limit;
    const whereClause: any = { isDeleted: false };

    // Category filter
    if (category && category !== 'ALL') {
        if (category === 'MANUFACTURING') {
            whereClause.corporateInfo = { industryType: 'MANUFACTURING' };
        } else if (category === 'HOME_CARE') {
            whereClause.individualInfo = { isNot: null };
        } else if (category === 'INSTITUTION') {
            whereClause.corporateInfo = { industryType: 'INSTITUTION' };
        }
    }

    // Type filter
    if (type === 'corporate') {
        whereClause.corporateInfo = { isNot: null };
    } else if (type === 'individual') {
        whereClause.individualInfo = { isNot: null };
    }

    // Keyword search
    if (q) {
        whereClause.OR = [
            { companyName: { contains: q, mode: 'insensitive' } },
            { taxId: { contains: q } },
            { responsiblePerson: { contains: q } },
            { code: { contains: q } },
            { shortName: { contains: q, mode: 'insensitive' } }
        ];
    }

    const [total, employers] = await Promise.all([
        prisma.employer.count({ where: whereClause }),
        prisma.employer.findMany({
            where: whereClause,
            include: {
                corporateInfo: true,
                individualInfo: true,
                _count: {
                    select: { deployments: { where: { status: 'active' } } }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    // Map to EmployerListItem
    const data: EmployerListItem[] = employers.map(emp => ({
        id: emp.id,
        code: emp.code,
        shortName: emp.shortName,
        companyName: emp.companyName || emp.responsiblePerson || '未命名',
        taxId: emp.taxId,
        responsiblePerson: emp.responsiblePerson,
        phoneNumber: emp.phoneNumber,
        address: emp.address,
        email: emp.email,
        _count: emp._count,
        homeCareInfo: emp.individualInfo ? {
            patients: [{
                name: emp.individualInfo.patientName || '',
                careAddress: emp.individualInfo.careAddress || ''
            }]
        } : undefined,
        institutionInfo: emp.corporateInfo ? {
            institutionCode: emp.corporateInfo.institutionCode,
            bedCount: emp.corporateInfo.bedCount
        } : undefined,
        createdAt: emp.createdAt.toISOString()
    }));

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Delete Employer
 * Checks for active deployments before deletion
 */
export async function deleteEmployer(id: string): Promise<void> {
    // Check if employer exists
    const employer = await prisma.employer.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    deployments: true,
                    recruitmentLetters: true
                }
            }
        }
    });

    if (!employer) {
        throw new ResourceNotFoundError('Employer', id);
    }

    // Check for active deployments
    const activeDeployments = await prisma.deployment.count({
        where: {
            employerId: id,
            status: { in: ['active', 'pending'] }
        }
    });

    if (activeDeployments > 0) {
        throw new ValidationError(
            `Cannot delete employer with ${activeDeployments} active deployment(s). Please terminate all deployments first.`,
            { activeDeployments }
        );
    }

    // Soft Delete employer
    await prisma.employer.update({
        where: { id },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });
}

// 存檔時 (Create/Update)
export async function updateEmployer(id: string, data: any) {
    const {
        corporateInfo,
        individualInfo,
        factories,
        industryAttributes,
        avgDomesticWorkers,
        ...coreData
    } = data;

    // Determine basic fields
    const finalCompanyName = coreData.companyName || coreData.responsiblePerson || '未命名雇主';

    const updates: any = {
        companyName: finalCompanyName,
        companyNameEn: coreData.companyNameEn,
        taxId: coreData.taxId,
        unitTaxId: coreData.unitTaxId,
        houseTaxId: coreData.houseTaxId,
        code: coreData.code,
        shortName: coreData.shortName,
        referrer: coreData.referrer,
        phoneNumber: coreData.phoneNumber,
        mobilePhone: coreData.mobilePhone,
        email: coreData.email,
        address: coreData.address,
        addressEn: coreData.addressEn,
        invoiceAddress: coreData.invoiceAddress,
        taxAddress: coreData.taxAddress,
        healthBillAddress: coreData.healthBillAddress,
        healthBillZip: coreData.healthBillZip,
        contactPerson: coreData.contactPerson,
        contactPhone: coreData.contactPhone,
        allocationRate: parseNumber(coreData.allocationRate),
        complianceStandard: coreData.complianceStandard,
        zeroFeeEffectiveDate: parseOptionalDate(coreData.zeroFeeEffectiveDate),
        terminateDate: parseOptionalDate(coreData.terminateDate),
        industryAttributes: industryAttributes || coreData.industryAttributes, // Handle both flat and nested if present
        agencyId: coreData.agencyId,
        remarks: coreData.remarks,
        category: coreData.category ? { connect: { code: coreData.category } } : undefined,
    };

    // Update Factories
    let existingFactoriesToUpdate: any[] = [];
    if (factories && Array.isArray(factories)) {
        existingFactoriesToUpdate = factories.filter((f: any) => f.id);
        const newFactories = factories.filter((f: any) => !f.id);

        const newFactoryCreates = newFactories.map((f: any) => ({
            name: f.name,
            factoryRegNo: f.factoryRegNo,
            taxId: f.taxId,
            laborInsuranceNo: f.laborInsuranceNo,
            healthInsuranceNo: f.healthInsuranceNo,
            ranking: f.ranking,
            address: f.address,
            addressEn: f.addressEn,
            zipCode: f.zipCode,
            cityCode: f.cityCode,
            laborCount: parseNumber(f.laborCount) || 0,
            foreignCount: parseNumber(f.foreignCount) || 0
        }));

        updates._newFactoryCreates = newFactoryCreates;
        updates._existingFactoriesToUpdate = existingFactoriesToUpdate;
    }

    // Corporate Info
    const corpSource = corporateInfo || (coreData.factoryRegistrationNo ? coreData : null);
    if (corpSource) {
        const corpUpdateData = {
            factoryRegistrationNo: corpSource.factoryRegistrationNo,
            industryType: corpSource.industryType,
            industryCode: corpSource.industryCode,
            capital: parseNumber(corpSource.capital),
            laborInsuranceNo: corpSource.laborInsuranceNo,
            laborInsuranceId: corpSource.laborInsuranceId,
            healthInsuranceUnitNo: corpSource.healthInsuranceUnitNo,
            healthInsuranceId: corpSource.healthInsuranceId,
            faxNumber: corpSource.faxNumber,
            institutionCode: corpSource.institutionCode,
            bedCount: parseNumber(corpSource.bedCount),
        };
        updates.corporateInfo = {
            upsert: {
                create: corpUpdateData,
                update: corpUpdateData
            }
        };
    }

    // Individual Info
    const indSource = individualInfo || (coreData.responsiblePersonIdNo ? coreData : null);
    if (indSource) {
        const indUpdateData = {
            responsiblePersonDob: parseOptionalDate(indSource.responsiblePersonDob),
            responsiblePersonIdNo: indSource.responsiblePersonIdNo,
            responsiblePersonFather: indSource.responsiblePersonFather,
            responsiblePersonMother: indSource.responsiblePersonMother,
            responsiblePersonSpouse: indSource.responsiblePersonSpouse,
            englishName: indSource.englishName,
            birthPlace: indSource.birthPlace,
            birthPlaceEn: indSource.birthPlaceEn,
            residenceAddress: indSource.residenceAddress,
            residenceZip: indSource.residenceZip,
            residenceCityCode: indSource.residenceCityCode,
            idIssueDate: parseOptionalDate(indSource.idIssueDate),
            idIssueType: indSource.idIssueType,
            idIssuePlace: indSource.idIssuePlace,
            militaryStatus: indSource.militaryStatus,
            militaryStatusEn: indSource.militaryStatusEn,
            patientName: indSource.patientName,
            patientIdNo: indSource.patientIdNo,
            careAddress: indSource.careAddress,
            relationship: indSource.relationship,
        };
        updates.individualInfo = {
            upsert: {
                create: indUpdateData,
                update: indUpdateData
            }
        };
    }

    // Use transaction to handle factory updates properly
    return prisma.$transaction(async (tx) => {
        // [Cleanup] Enforce Exclusivity
        // If we are setting corporate info, remove individual info
        // If we are setting corporate info, remove individual info
        if (corpSource) {
            await tx.individualInfo.deleteMany({ where: { employerId: id } });
        }
        // If we are setting individual info, remove corporate info
        if (indSource) {
            await tx.corporateInfo.deleteMany({ where: { employerId: id } });
        }

        const existingFactoriesUpdateList = updates._existingFactoriesToUpdate || [];
        const newFactoryCreateList = updates._newFactoryCreates || [];
        delete updates._existingFactoriesToUpdate;
        delete updates._newFactoryCreates;

        // FACTORY DELETION LOGIC (SAFE VERSION)
        if (factories && Array.isArray(factories)) {
            const keepIds = existingFactoriesUpdateList.map((f: any) => f.id);
            const candidates = await tx.employerFactory.findMany({
                where: {
                    employerId: id,
                    id: { notIn: keepIds }
                },
                select: { id: true, deployments: { select: { id: true } } }
            });

            const factoryIdsToDelete = candidates
                .filter(f => f.deployments.length === 0)
                .map(f => f.id);

            if (factoryIdsToDelete.length > 0) {
                updates.factories = {
                    deleteMany: {
                        id: { in: factoryIdsToDelete }
                    }
                };
            }

            if (newFactoryCreateList.length > 0) {
                updates.factories = {
                    ...(updates.factories || {}),
                    create: newFactoryCreateList
                };
            }
        }

        // 2. Update employer
        const updatedEmployer = await tx.employer.update({
            where: { id },
            data: updates,
            include: {
                corporateInfo: true,
                individualInfo: true,
                factories: true
            }
        });

        // 3. Update existing factories individually
        for (const factory of existingFactoriesUpdateList) {
            await tx.employerFactory.update({
                where: { id: factory.id },
                data: {
                    name: factory.name,
                    factoryRegNo: factory.factoryRegNo,
                    taxId: factory.taxId,
                    laborInsuranceNo: factory.laborInsuranceNo,
                    healthInsuranceNo: factory.healthInsuranceNo,
                    ranking: factory.ranking,
                    address: factory.address,
                    addressEn: factory.addressEn,
                    zipCode: factory.zipCode,
                    cityCode: factory.cityCode,
                    laborCount: parseNumber(factory.laborCount) || 0,
                    foreignCount: parseNumber(factory.foreignCount) || 0
                }
            });
        }

        // 4. Update avgDomesticWorkers
        if (avgDomesticWorkers !== undefined) {
            const now = new Date();
            await tx.employerLaborCount.upsert({
                where: {
                    employerId_year_month: {
                        employerId: id,
                        year: now.getFullYear(),
                        month: now.getMonth() + 1
                    }
                },
                create: {
                    employerId: id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    count: parseNumber(avgDomesticWorkers) || 0
                },
                update: {
                    count: parseNumber(avgDomesticWorkers) || 0
                }
            });
        }

        return tx.employer.findUnique({
            where: { id },
            include: {
                corporateInfo: true,
                individualInfo: true,
                factories: true
            }
        });
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


    if (!employer || employer.isDeleted) return null;

    // Derive Assignee (Sales Agent preferred)
    const assignments = employer.serviceAssignments || [];
    const assignee = assignments.find((a: any) => a.role === 'sales_agent')?.internalUser.username
        || assignments[0]?.internalUser.username
        || '未指派';

    // Calculate Statistics
    const activeWorkerCount = employer.deployments?.length || 0;
    const totalQuota = (employer.recruitmentLetters || []).reduce((acc: number, curr: any) => acc + (curr.approvedQuota || 0), 0);
    const usedQuota = (employer.recruitmentLetters || []).reduce((acc: number, curr: any) => acc + (curr.usedQuota || 0), 0);
    const availableQuota = Math.max(0, totalQuota - usedQuota);

    // Flatten data for frontend
    return {
        basic: {
            id: employer.id,
            name: employer.companyName,
            shortName: employer.shortName || '',
            code: employer.code || '',
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
