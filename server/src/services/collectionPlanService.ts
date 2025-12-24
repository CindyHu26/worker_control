import prisma from '../prisma';
import { Prisma } from '../generated/client';

// Include all child relations when fetching
const collectionPlanInclude = {
    billingCycles: true,
    healthCheckFees: true,
    residencePermits: true,
    insuranceFees: true,
    brokerFees: true,
    employerFees: true,
    feeItems: {
        orderBy: { sortOrder: 'asc' as const }
    }
};

export const getCollectionPlans = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.CollectionPlanWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nationalityCode: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.collectionPlan.count({ where }),
        prisma.collectionPlan.findMany({
            where,
            skip,
            take: limit,
            orderBy: { code: 'asc' },
            include: collectionPlanInclude,
        }),
    ]);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getCollectionPlanById = async (id: string) => {
    return prisma.collectionPlan.findUnique({
        where: { id },
        include: collectionPlanInclude,
    });
};

export const createCollectionPlan = async (data: {
    code: string;
    nationalityCode: string;
    category?: 'household' | 'corporate';
    salaryCalcMethod?: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    payDay?: number;
    cutoffDay?: number;
    calculateByDays?: boolean;
    preciseCalculation?: boolean;
    monthlySalaryMethod?: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    isActive?: boolean;
    billingCycles?: Array<{ periodStart: number; periodEnd: number; monthsPerBill?: number }>;
    healthCheckFees?: Array<{ checkType: string; collectionPeriod?: number; feeMale?: number; feeFemale?: number }>;
    residencePermits?: Array<{ year: number; collectionPeriod?: number }>;
    insuranceFees?: Array<{ year: number; collectionPeriod?: number; amount?: number; target?: string; sourceType?: string }>;
    brokerFees?: Array<{ feeType: string; collectionPeriod?: number; amount?: number; amountMidSkill?: number; sourceType?: string }>;
    employerFees?: Array<{ year: number; collectionPeriod?: number; amount?: number; sourceType?: string }>;
    feeItems?: Array<{ feeItemId?: string; amountPerPeriod?: number; periodStart?: number; periodEnd?: number; entryOnly?: boolean; target?: string; sortOrder?: number }>;
}) => {
    const { billingCycles, healthCheckFees, residencePermits, insuranceFees, brokerFees, employerFees, feeItems, ...planData } = data;

    return prisma.collectionPlan.create({
        data: {
            ...planData,
            billingCycles: billingCycles ? { create: billingCycles } : undefined,
            healthCheckFees: healthCheckFees ? { create: healthCheckFees } : undefined,
            residencePermits: residencePermits ? { create: residencePermits } : undefined,
            insuranceFees: insuranceFees ? { create: insuranceFees as any } : undefined,
            brokerFees: brokerFees ? { create: brokerFees as any } : undefined,
            employerFees: employerFees ? { create: employerFees as any } : undefined,
            feeItems: feeItems ? { create: feeItems as any } : undefined,
        },
        include: collectionPlanInclude,
    });
};

export const updateCollectionPlan = async (id: string, data: {
    code?: string;
    nationalityCode?: string;
    category?: 'household' | 'corporate';
    salaryCalcMethod?: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    payDay?: number;
    cutoffDay?: number;
    calculateByDays?: boolean;
    preciseCalculation?: boolean;
    monthlySalaryMethod?: 'entry_date' | 'handover_date' | 'handover_next' | 'monthly' | 'entry_plus_one';
    isActive?: boolean;
    billingCycles?: Array<{ periodStart: number; periodEnd: number; monthsPerBill?: number }>;
    healthCheckFees?: Array<{ checkType: string; collectionPeriod?: number; feeMale?: number; feeFemale?: number }>;
    residencePermits?: Array<{ year: number; collectionPeriod?: number }>;
    insuranceFees?: Array<{ year: number; collectionPeriod?: number; amount?: number; target?: string; sourceType?: string }>;
    brokerFees?: Array<{ feeType: string; collectionPeriod?: number; amount?: number; amountMidSkill?: number; sourceType?: string }>;
    employerFees?: Array<{ year: number; collectionPeriod?: number; amount?: number; sourceType?: string }>;
    feeItems?: Array<{ feeItemId?: string; amountPerPeriod?: number; periodStart?: number; periodEnd?: number; entryOnly?: boolean; target?: string; sortOrder?: number }>;
}) => {
    const { billingCycles, healthCheckFees, residencePermits, insuranceFees, brokerFees, employerFees, feeItems, ...planData } = data;

    // Use transaction for atomic update with child deletion and recreation
    return prisma.$transaction(async (tx) => {
        // Delete existing children if new data is provided
        if (billingCycles !== undefined) {
            await tx.collectionPlanBillingCycle.deleteMany({ where: { collectionPlanId: id } });
        }
        if (healthCheckFees !== undefined) {
            await tx.collectionPlanHealthCheckFee.deleteMany({ where: { collectionPlanId: id } });
        }
        if (residencePermits !== undefined) {
            await tx.collectionPlanResidencePermit.deleteMany({ where: { collectionPlanId: id } });
        }
        if (insuranceFees !== undefined) {
            await tx.collectionPlanInsuranceFee.deleteMany({ where: { collectionPlanId: id } });
        }
        if (brokerFees !== undefined) {
            await tx.collectionPlanBrokerFee.deleteMany({ where: { collectionPlanId: id } });
        }
        if (employerFees !== undefined) {
            await tx.collectionPlanEmployerFee.deleteMany({ where: { collectionPlanId: id } });
        }
        if (feeItems !== undefined) {
            await tx.collectionPlanFeeItem.deleteMany({ where: { collectionPlanId: id } });
        }

        // Update parent and create new children
        return tx.collectionPlan.update({
            where: { id },
            data: {
                ...planData,
                billingCycles: billingCycles ? { create: billingCycles } : undefined,
                healthCheckFees: healthCheckFees ? { create: healthCheckFees } : undefined,
                residencePermits: residencePermits ? { create: residencePermits } : undefined,
                insuranceFees: insuranceFees ? { create: insuranceFees as any } : undefined,
                brokerFees: brokerFees ? { create: brokerFees as any } : undefined,
                employerFees: employerFees ? { create: employerFees as any } : undefined,
                feeItems: feeItems ? { create: feeItems as any } : undefined,
            },
            include: collectionPlanInclude,
        });
    });
};

export const deleteCollectionPlan = async (id: string) => {
    return prisma.collectionPlan.delete({
        where: { id },
    });
};
