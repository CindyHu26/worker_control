
import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { addMonths, differenceInDays, differenceInMonths, differenceInYears, endOfMonth, isBefore, isSameMonth, parseISO, startOfMonth, addDays } from 'date-fns';

// Local Enums matching Schema Phase 8
enum BillingItemCategory {
    SERVICE_FEE = 'SERVICE_FEE',
    ARC_FEE = 'ARC_FEE',
    HEALTH_CHECK_FEE = 'HEALTH_CHECK_FEE',
    DORMITORY_FEE = 'DORMITORY_FEE',
    MEDICAL_FEE = 'MEDICAL_FEE',
    INSURANCE_FEE = 'INSURANCE_FEE',
    AIRPORT_PICKUP = 'AIRPORT_PICKUP',
    TRAINING_FEE = 'TRAINING_FEE',
    PLACEMENT_FEE = 'PLACEMENT_FEE',
    STABILIZATION_FEE = 'STABILIZATION_FEE',
    ADMIN_FEE = 'ADMIN_FEE',
    OTHER_FEE = 'OTHER_FEE'
}

enum BillToParty {
    WORKER = 'WORKER',
    EMPLOYER = 'EMPLOYER',
    AGENCY = 'AGENCY'
}

export class BillingGeneratorService {

    /**
     * Calculate worker's total tenure in Taiwan in MONTHS.
     * Logic: Sum of all previous completed/active deployments + current deployment time up to target date.
     * Note: This simplifies by assuming continuous stay or specific logic unless historical data is rich.
     */
    private async calculateTotalTenure(workerId: string, referenceDate: Date): Promise<number> {
        // Fetch worker history
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: {
                deployments: {
                    where: {
                        status: { not: 'cancelled' }, // Use 'cancelled' string literal if enum not available
                        // Or deployment status logic
                    }
                }
            }
        });

        if (!worker) return 0;

        let totalDays = 0;

        // Simplify: Calculate days from first entry date if available?
        // Or sum ranges.
        // Assuming deployment ranges don't overlap.
        for (const dep of worker.deployments) {
            const start = dep.startDate ? new Date(dep.startDate) : null;
            if (!start) continue;

            // If deployment starts AFTER reference date, ignore (it's in future)
            if (isBefore(referenceDate, start)) continue;

            const end = dep.endDate ? new Date(dep.endDate) : new Date(); // If ongoing, up to today?
            // Actually, we want tenure UP TO referenceDate.
            const effectiveEnd = isBefore(end, referenceDate) ? end : referenceDate;

            // Only add if start < effectiveEnd
            if (isBefore(start, effectiveEnd)) {
                totalDays += differenceInDays(effectiveEnd, start);
            }
        }

        return Math.floor(totalDays / 30); // Rough approximation
    }

    /**
     * Determine Service Fee based on tenure (Dynamic Logic)
     */
    private getServiceFeeRate(tenureMonths: number): number {
        if (tenureMonths < 12) return 1800;
        if (tenureMonths < 24) return 1700;
        return 1500;
    }

    /**
     * Internal helper to calculate strict plan items
     */
    async calculatePlanItems(deployment: any): Promise<any[]> {
        const startDate = new Date(deployment.startDate);
        // Default 3 years if no end date
        const endDate = deployment.endDate ? new Date(deployment.endDate) : addMonths(startDate, 36);

        const items: any[] = [];
        const workerId = deployment.workerId;
        const workerNationality = deployment.worker?.nationality || 'IDN';
        const workerGender = deployment.worker?.gender || 'FEMALE';

        // Initial base tenure (before this contract)
        // Should query DB, but for now assuming 0 if new worker, or calculate from previous.
        // Optimization: Calculate baseline once.
        const baseTenureInDays = 0; // TODO: Fetch from worker history

        // 1. Service Fees (Dynamic Tiered)
        let current = new Date(startDate);

        while (isBefore(current, endDate) || isSameMonth(current, endDate)) {
            const isStartMonth = isSameMonth(current, startDate);
            const isEndMonth = isSameMonth(current, endDate);

            // Calculate tenure at THIS month billing date
            const daysSinceStart = differenceInDays(current, startDate);
            const currentTotalTenureMonths = Math.floor((baseTenureInDays + daysSinceStart) / 30);

            const monthlyRate = this.getServiceFeeRate(currentTotalTenureMonths);

            let amount = monthlyRate;
            let isProrated = false;
            let description = '';
            let proratedDays = 0;

            if (isStartMonth) {
                const dayOfMonth = startDate.getDate();
                if (dayOfMonth > 1) {
                    // Logic: 30 days basis
                    const billableDays = Math.min(30, Math.max(0, 30 - dayOfMonth + 1));
                    amount = Math.round((monthlyRate / 30) * billableDays);
                    isProrated = true;
                    proratedDays = billableDays;
                    description = `首月破月: ${billableDays}天 (費率:${monthlyRate})`;
                } else {
                    description = `費率: ${monthlyRate}`;
                }
            } else if (isEndMonth) {
                const dayOfMonth = endDate.getDate();
                if (dayOfMonth < 30) {
                    const billableDays = dayOfMonth;
                    amount = Math.round((monthlyRate / 30) * billableDays);
                    isProrated = true;
                    proratedDays = billableDays;
                    description = `末月破月: ${billableDays}天 (費率:${monthlyRate})`;
                } else {
                    description = `費率: ${monthlyRate}`;
                }
            } else {
                description = `費率: ${monthlyRate}`;
            }

            items.push({
                billingDate: startOfMonth(current),
                amount,
                itemCategory: BillingItemCategory.SERVICE_FEE,
                status: 'GENERATED', // BillingItemStatus
                isProrated,
                proratedDays: isProrated ? proratedDays : null,
                description,
                billTo: BillToParty.WORKER,
                calculatedFrom: {
                    method: 'TIERED_SERVICE_FEE',
                    tenure: currentTotalTenureMonths,
                    rate: monthlyRate
                }
            });

            current = addMonths(current, 1);
        }

        // 2. ARC Fee (Dynamic Surcharge?)
        // Standard logic: 1000 per year, max 3 years, passport limited
        const passportExpiry = deployment.worker.passports[0]?.expiryDate;
        const validUnil = passportExpiry && isBefore(new Date(passportExpiry), endDate)
            ? new Date(passportExpiry)
            : endDate;

        const totalMonths = differenceInMonths(validUnil, startDate);
        const yearsRequired = Math.ceil(totalMonths / 12);
        const validYears = Math.max(1, yearsRequired);

        let arcDesc = `居留證 ${validYears} 年`;
        if (passportExpiry && isBefore(new Date(passportExpiry), endDate)) {
            arcDesc += ' (護照效期限制，需中途換發)';
        }

        items.push({
            billingDate: addMonths(startDate, 1),
            amount: validYears * 1000,
            itemCategory: BillingItemCategory.ARC_FEE,
            status: 'GENERATED',
            description: arcDesc,
            billTo: BillToParty.WORKER
        });

        // 3. Dormitory (From Relation)
        const bed = deployment.worker.bed;
        if (bed) {
            const dorm = bed.room.dormitory;
            const rent = Number(dorm.rentFee || 0);
            const mgmt = Number(dorm.managementFee || 0);
            const totalDorm = rent + mgmt;

            if (totalDorm > 0) {
                let loopDate = new Date(startDate);
                while (isBefore(loopDate, endDate) || isSameMonth(loopDate, endDate)) {
                    items.push({
                        billingDate: startOfMonth(loopDate),
                        amount: totalDorm,
                        itemCategory: BillingItemCategory.DORMITORY_FEE,
                        status: 'GENERATED',
                        description: `租金:${rent} 管理:${mgmt}`,
                        billTo: BillToParty.WORKER
                    });
                    loopDate = addMonths(loopDate, 1);
                }
            }
        }

        // 4. Health Check (Nationality/Gender Surcharge)
        // Base: 2000
        // Surcharge: IDN +400, VN +0
        // Gender: FEMALE +200 check

        let healthBase = 2000;
        let surchargeDesc = '';

        if (workerNationality === 'IDN') {
            healthBase += 400; // Fake rule for demo
            surchargeDesc += ' (印尼加驗)';
        }

        // Example check points
        const checkPoints = [6, 18, 30];
        checkPoints.forEach(monthOffset => {
            const checkDate = addMonths(startDate, monthOffset);
            if (isBefore(checkDate, endDate)) {
                items.push({
                    billingDate: addMonths(startDate, monthOffset - 1),
                    amount: healthBase,
                    itemCategory: BillingItemCategory.HEALTH_CHECK_FEE,
                    status: 'GENERATED',
                    description: `定期體檢 (第${monthOffset}個月)${surchargeDesc}`,
                    billTo: BillToParty.WORKER, // Usually
                    calculatedFrom: {
                        base: 2000,
                        nationality: workerNationality,
                        surcharge: healthBase - 2000
                    }
                });
            }
        });

        return items;
    }

    private async getDeploymentFull(deploymentId: string) {
        return prisma.deployment.findUnique({
            where: { id: deploymentId },
            include: {
                employer: true,
                worker: {
                    include: {
                        passports: { where: { isCurrent: true } },
                        bed: { include: { room: { include: { dormitory: true } } } }
                    }
                }
            }
        });
    }

    async generatePlan(deploymentId: string) {
        const deployment = await this.getDeploymentFull(deploymentId);
        if (!deployment) throw new Error('Deployment not found');
        if (!deployment.startDate) throw new Error('Deployment start date is missing');

        const items = await this.calculatePlanItems(deployment);

        // Use 'any' casting for new models until client is regenerated
        await (prisma as any).billingPlan.deleteMany({
            where: { deploymentId, status: 'PENDING' }
        });

        const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

        return (prisma as any).billingPlan.create({
            data: {
                deploymentId,
                totalAmount,
                status: 'PENDING',
                reviewStatus: 'NORMAL',
                items: { create: items }
            },
            include: { items: { orderBy: { billingDate: 'asc' } } }
        });
    }

    /**
     * Simulate a plan calculation and compare with existing plan.
     */
    async simulatePlan(planId: string) {
        const existingPlan = await (prisma as any).billingPlan.findUnique({
            where: { id: planId },
            include: { items: { orderBy: { billingDate: 'asc' } } }
        });

        if (!existingPlan) throw new Error('Plan not found');

        const deployment = await this.getDeploymentFull(existingPlan.deploymentId);
        if (!deployment) throw new Error('Deployment not found (for simulation)');

        const suggestedItems = await this.calculatePlanItems(deployment);

        const diffs = suggestedItems.map(suggested => {
            const suggestedDateStr = suggested.billingDate ? new Date(suggested.billingDate as any).toISOString().substring(0, 10) : '';

            const match = existingPlan.items.find((existing: any) => {
                const existingDateStr = new Date(existing.billingDate).toISOString().substring(0, 10);
                return existingDateStr === suggestedDateStr && existing.itemCategory === suggested.itemCategory;
            });

            const suggestedAmt = Number(suggested.amount || 0);
            const existingAmt = match ? Number(match.amount) : 0;

            return {
                ...suggested,
                existingAmount: match ? match.amount : null,
                isDifferent: match ? Number(match.amount) !== suggestedAmt : true,
                diffAmount: suggestedAmt - existingAmt
            };
        });

        return {
            deployment,
            currentTotal: existingPlan.totalAmount,
            suggestedTotal: diffs.reduce((sum, item) => sum + (item.amount || 0), 0),
            items: diffs
        };
    }

    /**
     * Triggered by Worker/Dorm updates.
     */
    async flagForReview(deploymentId: string, reason: string) {
        const plan = await (prisma as any).billingPlan.findFirst({
            where: { deploymentId }
        });

        if (plan && (plan.status === 'CONFIRMED' || plan.status === 'PENDING')) {
            await (prisma as any).billingPlan.update({
                where: { id: plan.id },
                data: {
                    reviewStatus: 'NEEDS_REVIEW',
                    reviewReason: reason
                }
            });
            console.log(`[Billing] Plan ${plan.id} flagged for review: ${reason}`);
        }
    }
}

export const billingService = new BillingGeneratorService();
