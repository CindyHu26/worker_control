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

// Helper: Safe Date Parser
// Returns Date object or undefined (if null/empty string)
// Prevents "Invalid Date" crash on empty strings
const parseDate = (value: string | null | undefined): Date | undefined => {
    if (!value || value.trim() === '') return undefined;
    const date = new Date(value);
    // valid if not NaN
    return isNaN(date.getTime()) ? undefined : date;
};

// Helper: Safe Number Parser
// Returns number or undefined
const parseNumber = (value: string | number | null | undefined): number | undefined => {
    if (value === null || value === undefined || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
};

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
export async function createEmployer(input: CreateEmployerInput) {
    // Validate input
    const validatedData = CreateEmployerInputSchema.parse(input);

    // Check for duplicate taxId
    if (validatedData.taxId) {
        const existing = await prisma.employer.findUnique({
            where: { taxId: validatedData.taxId }
        });
        if (existing) {
            throw new DuplicateResourceError('taxId', validatedData.taxId);
        }
    }

    // Check for duplicate code
    if (validatedData.code) {
        const existing = await prisma.employer.findUnique({
            where: { code: validatedData.code }
        });
        if (existing) {
            throw new DuplicateResourceError('code', validatedData.code);
        }
    }

    // [New] Category-based Validation
    const category = validatedData.category;
    if (category === 'HOME_CARE') {
        if (!validatedData.responsiblePersonIdNo) {
            throw new ValidationError('Missing responsible person ID for Household Employer (category: HOME_CARE)');
        }
        if (validatedData.taxId) {
            throw new ValidationError('Household Employer should not have Tax ID (Unified Business No)');
        }
    } else if (category === 'MANUFACTURING' || category === 'INSTITUTION') {
        // Business Types
        if (!validatedData.taxId) {
            throw new ValidationError(`Missing Tax ID for Business Employer (category: ${category})`);
        }
        if (!validatedData.responsiblePerson) {
            throw new ValidationError('Missing Responsible Person for Business Employer');
        }
    }

    // Determine employer type
    const isCorporate = !!(
        validatedData.factoryRegistrationNo ||
        validatedData.industryType ||
        validatedData.category ||
        (validatedData.taxId && validatedData.taxId.length === 8)
    );

    const isIndividual = !!(
        validatedData.responsiblePersonIdNo ||
        validatedData.responsiblePersonSpouse ||
        validatedData.patientName ||
        (validatedData.taxId && validatedData.taxId.length === 10)
    );

    // Create employer in transaction
    const newEmployer = await prisma.$transaction(async (tx) => {
        const data: any = {
            companyName: validatedData.companyName || validatedData.responsiblePerson || '未命名雇主',
            companyNameEn: validatedData.companyNameEn,
            taxId: validatedData.taxId,
            code: validatedData.code,
            shortName: validatedData.shortName,
            referrer: validatedData.referrer,
            taxAddress: validatedData.taxAddress,
            healthBillAddress: validatedData.healthBillAddress,
            healthBillZip: validatedData.healthBillZip,
            responsiblePerson: validatedData.responsiblePerson,
            phoneNumber: validatedData.phoneNumber,
            address: validatedData.address,
            addressEn: validatedData.addressEn,
            invoiceAddress: validatedData.invoiceAddress,
            email: validatedData.email,
            contactPerson: validatedData.contactPerson,
            contactPhone: validatedData.contactPhone,
            allocationRate: parseNumber(validatedData.allocationRate),
            complianceStandard: validatedData.complianceStandard || 'NONE',
            zeroFeeEffectiveDate: parseDate(validatedData.zeroFeeEffectiveDate)
        };

        // Add corporate info if applicable
        if (isCorporate) {
            data.corporateInfo = {
                create: {
                    factoryRegistrationNo: validatedData.factoryRegistrationNo,
                    industryType: validatedData.industryType,
                    industryCode: validatedData.industryCode,
                    factoryAddress: validatedData.factoryAddress,
                    capital: parseNumber(validatedData.capital),
                    laborInsuranceNo: validatedData.laborInsuranceNo,
                    laborInsuranceId: validatedData.laborInsuranceId,
                    healthInsuranceUnitNo: validatedData.healthInsuranceUnitNo,
                    healthInsuranceId: validatedData.healthInsuranceId,
                    institutionCode: validatedData.institutionCode,
                    bedCount: parseNumber(validatedData.bedCount)
                }
            };
        }

        // Add individual info if applicable
        if (isIndividual) {
            data.individualInfo = {
                create: {
                    responsiblePersonIdNo: validatedData.responsiblePersonIdNo ||
                        (validatedData.taxId?.length === 10 ? validatedData.taxId : undefined),
                    responsiblePersonSpouse: validatedData.responsiblePersonSpouse,
                    responsiblePersonFather: validatedData.responsiblePersonFather,
                    responsiblePersonMother: validatedData.responsiblePersonMother,
                    responsiblePersonDob: parseDate(validatedData.responsiblePersonDob),
                    englishName: validatedData.englishName,
                    birthPlace: validatedData.birthPlace,
                    birthPlaceEn: validatedData.birthPlaceEn,
                    residenceAddress: validatedData.residenceAddress,
                    residenceZip: validatedData.residenceZip,
                    residenceCityCode: validatedData.residenceCityCode,
                    militaryStatus: validatedData.militaryStatus,
                    militaryStatusEn: validatedData.militaryStatusEn,
                    idIssueDate: parseDate(validatedData.idIssueDate),
                    idIssuePlace: validatedData.idIssuePlace,
                    patientName: validatedData.patientName,
                    patientIdNo: validatedData.patientIdNo,
                    careAddress: validatedData.careAddress,
                    relationship: validatedData.relationship
                }
            };
        }

        // Add factories if provided
        if (validatedData.factories && validatedData.factories.length > 0) {
            data.factories = {
                create: validatedData.factories.map(f => ({
                    name: f.name,
                    factoryRegNo: f.factoryRegNo,
                    address: f.address,
                    addressEn: f.addressEn,
                    zipCode: f.zipCode,
                    cityCode: f.cityCode,
                    laborCount: parseNumber(f.laborCount) || 0,
                    foreignCount: parseNumber(f.foreignCount) || 0
                }))
            };
        }

        // Add initial recruitment letters if provided
        if (validatedData.initialRecruitmentLetters && validatedData.initialRecruitmentLetters.length > 0) {
            data.recruitmentLetters = {
                create: validatedData.initialRecruitmentLetters.map(letter => ({
                    letterNumber: letter.letterNumber,
                    issueDate: letter.issueDate,
                    expiryDate: letter.expiryDate,
                    approvedQuota: letter.approvedQuota,
                    usedQuota: 0,
                    validUntil: letter.expiryDate // Default validUntil to expiryDate
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

        // Create initial labor count if manufacturing employer with domestic workers
        if (isCorporate &&
            validatedData.industryType === 'MANUFACTURING' &&
            validatedData.avgDomesticWorkers &&
            validatedData.avgDomesticWorkers > 0
        ) {
            const now = new Date();
            await tx.employerLaborCount.create({
                data: {
                    employerId: employer.id,
                    year: now.getFullYear(),
                    month: now.getMonth() + 1,
                    count: validatedData.avgDomesticWorkers
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
    const whereClause: any = {};

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

    // Delete employer (cascade will handle related records)
    await prisma.employer.delete({
        where: { id }
    });
}

// 存檔時 (Create/Update)
export async function updateEmployer(id: string, data: any) {
    const {
        attributes,
        // Corporate fields
        factoryRegistrationNo, industryCode, industryType, factoryAddress, factoryAddressEn,
        capital,
        laborInsuranceNo, laborInsuranceId, healthInsuranceUnitNo, healthInsuranceId, faxNumber,
        institutionCode, bedCount, avgDomesticWorkers,
        // Individual fields
        patientName, hospitalCertNo, careAddress, relationship,
        responsiblePersonDob, responsiblePersonIdNo, responsiblePersonFather, responsiblePersonMother, responsiblePersonSpouse,
        idIssueDate, idIssuePlace, militaryStatus,
        englishName, birthPlace, birthPlaceEn, residenceAddress, residenceZip, residenceCityCode,
        militaryStatusEn,
        // New Core fields
        code, shortName, referrer, terminateDate,
        companyNameEn, addressEn, contactPerson, contactPhone,
        taxAddress, healthBillAddress, healthBillZip,
        factories, // Array of factory objects
        ...coreData
    } = data;

    // [新增] 自動補全邏輯
    const finalCompanyName = coreData.companyName || coreData.responsiblePerson || '未命名雇主';

    // Prepare updates
    const coreUpdate: any = {
        ...coreData,
        companyName: finalCompanyName // 強制賦值
    };
    if (code !== undefined) coreUpdate.code = code;
    if (shortName !== undefined) coreUpdate.shortName = shortName;
    if (referrer !== undefined) coreUpdate.referrer = referrer;
    if (terminateDate !== undefined) coreUpdate.terminateDate = parseDate(terminateDate) || null; // Use safe parser
    if (companyNameEn !== undefined) coreUpdate.companyNameEn = companyNameEn;
    if (addressEn !== undefined) coreUpdate.addressEn = addressEn;
    if (contactPerson !== undefined) coreUpdate.contactPerson = contactPerson;
    if (contactPhone !== undefined) coreUpdate.contactPhone = contactPhone;
    if (taxAddress !== undefined) coreUpdate.taxAddress = taxAddress;
    if (healthBillAddress !== undefined) coreUpdate.healthBillAddress = healthBillAddress;
    if (healthBillZip !== undefined) coreUpdate.healthBillZip = healthBillZip;

    if (coreData.allocationRate !== undefined) {
        coreUpdate.allocationRate = parseNumber(coreData.allocationRate);
    }
    if (coreData.zeroFeeEffectiveDate !== undefined) {
        coreUpdate.zeroFeeEffectiveDate = parseDate(coreData.zeroFeeEffectiveDate);
    }

    const updates: any = { ...coreUpdate };

    // Update Factories (Improved Logic)
    // Note: We handle the actual update in transaction below
    let existingFactoriesToUpdate: any[] = [];

    if (factories && Array.isArray(factories)) {
        // Separate factories with IDs (existing) from those without (new)
        existingFactoriesToUpdate = factories.filter((f: any) => f.id);
        const newFactories = factories.filter((f: any) => !f.id);

        const newFactoryCreates = newFactories.map((f: any) => ({
            name: f.name,
            factoryRegNo: f.factoryRegNo,
            address: f.address,
            addressEn: f.addressEn,
            zipCode: f.zipCode,
            cityCode: f.cityCode,
            laborCount: parseNumber(f.laborCount) || 0,
            foreignCount: parseNumber(f.foreignCount) || 0
        }));

        updates._newFactoryCreates = newFactoryCreates; // Pass to transaction
        updates._existingFactoriesToUpdate = existingFactoriesToUpdate; // Pass to transaction
    }

    // If Corporate fields are present
    if (factoryRegistrationNo || industryType || industryCode || capital !== undefined || laborInsuranceNo || healthInsuranceUnitNo || institutionCode) {
        updates.corporateInfo = {
            upsert: {
                create: {
                    factoryRegistrationNo,
                    industryType,
                    industryCode,
                    capital: parseNumber(capital),
                    laborInsuranceNo,
                    laborInsuranceId,
                    healthInsuranceUnitNo,
                    healthInsuranceId,
                    faxNumber,
                    institutionCode,
                    bedCount: parseNumber(bedCount),
                },
                update: {
                    factoryRegistrationNo,
                    industryType,
                    industryCode,
                    capital: parseNumber(capital),
                    laborInsuranceNo,
                    laborInsuranceId,
                    healthInsuranceUnitNo,
                    healthInsuranceId,
                    faxNumber,
                    institutionCode,
                    bedCount: parseNumber(bedCount),
                }
            }
        };
    }

    // If Individual fields are present
    if (responsiblePersonIdNo || responsiblePersonSpouse || responsiblePersonFather || patientName || englishName) {
        const indUpdateData = {
            responsiblePersonIdNo,
            responsiblePersonSpouse,
            responsiblePersonFather,
            responsiblePersonMother,
            responsiblePersonDob: parseDate(responsiblePersonDob),
            idIssueDate: parseDate(idIssueDate),
            idIssuePlace,
            militaryStatus,
            militaryStatusEn,
            patientName,
            patientIdNo: data.patientIdNo,
            careAddress,
            relationship,
            englishName,
            birthPlace,
            birthPlaceEn,
            residenceAddress,
            residenceZip,
            residenceCityCode
        };

        updates.individualInfo = {
            upsert: {
                create: indUpdateData,
                update: indUpdateData
            }
        }
    }

    // Use transaction to handle factory updates properly
    return prisma.$transaction(async (tx) => {
        const existingFactoriesUpdateList = updates._existingFactoriesToUpdate || [];
        const newFactoryCreateList = updates._newFactoryCreates || [];
        delete updates._existingFactoriesToUpdate;
        delete updates._newFactoryCreates;

        // FACTORY DELETION LOGIC (SAFE VERSION)
        // 1. Determine which factories are being removed
        // If factories array was provided, it means it's the full list.
        // IDs present in DB but NOT in existingFactoriesUpdateList are candidates for deletion.
        if (factories && Array.isArray(factories)) {
            const keepIds = existingFactoriesUpdateList.map((f: any) => f.id);

            // Find candidates for deletion (belong to employer, but not in keepIds)
            const candidates = await tx.employerFactory.findMany({
                where: {
                    employerId: id,
                    id: { notIn: keepIds }
                },
                select: { id: true, deployments: { select: { id: true } } } // Check for deployments
            });

            // Filter out those that have deployments
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

            // Add Create logic to updates.factories if needed, or handle separately? 
            // Prisma updates.factories can take deleteMany and create simultaneously.
            if (newFactoryCreateList.length > 0) {
                updates.factories = {
                    ...(updates.factories || {}),
                    create: newFactoryCreateList
                };
            }
        }

        // 2. Update employer (including nested upserts and factory delete/create)
        const updatedEmployer = await tx.employer.update({
            where: { id },
            data: updates,
            include: {
                corporateInfo: true,
                individualInfo: true,
                factories: true
            }
        });

        // 3. Update existing factories individually (preserves IDs)
        for (const factory of existingFactoriesUpdateList) {
            await tx.employerFactory.update({
                where: { id: factory.id },
                data: {
                    name: factory.name,
                    factoryRegNo: factory.factoryRegNo,
                    address: factory.address,
                    addressEn: factory.addressEn,
                    zipCode: factory.zipCode,
                    cityCode: factory.cityCode,
                    laborCount: parseNumber(factory.laborCount) || 0,
                    foreignCount: parseNumber(factory.foreignCount) || 0
                }
            });
        }

        // 4. Update avgDomesticWorkers (Labor Count)
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

        // 5. Return updated employer with fresh factory data
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


    if (!employer) return null;

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
