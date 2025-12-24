import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { addMonths, differenceInDays, differenceInMonths, differenceInYears, endOfMonth, isBefore, isSameMonth, parseISO, startOfMonth } from 'date-fns';

export class BillingGeneratorService {
    /**
     * Internal helper to calculate strict plan items
     */
    async calculatePlanItems(deployment: any): Promise<Prisma.BillingPlanItemCreateWithoutBillingPlanInput[]> {
        const startDate = new Date(deployment.startDate);
        const endDate = deployment.endDate ? new Date(deployment.endDate) : addMonths(startDate, 36);
        const serviceFee = deployment.employer.monthlyServiceFee || 1500;

        const items: Prisma.BillingPlanItemCreateWithoutBillingPlanInput[] = [];

        // 1. Service Fees
        let current = new Date(startDate);
        while (isBefore(current, endDate) || isSameMonth(current, endDate)) {
            const isStartMonth = isSameMonth(current, startDate);
            const isEndMonth = isSameMonth(current, endDate);

            let amount = serviceFee;
            let isProrated = false;
            let description = '';

            if (isStartMonth) {
                const dayOfMonth = startDate.getDate();
                if (dayOfMonth > 1) {
                    const billableDays = Math.min(30, Math.max(0, 30 - dayOfMonth + 1));
                    amount = Math.round((serviceFee / 30) * billableDays);
                    isProrated = true;
                    description = `首月破月: ${billableDays}天`;
                }
            } else if (isEndMonth) {
                const dayOfMonth = endDate.getDate();
                if (dayOfMonth < 30) {
                    const billableDays = dayOfMonth;
                    amount = Math.round((serviceFee / 30) * billableDays);
                    isProrated = true;
                    description = `末月破月: ${billableDays}天`;
                }
            }

            items.push({
                billingDate: startOfMonth(current),
                amount,
                itemCategory: 'SERVICE_FEE',
                status: 'GENERATED',
                isProrated,
                description
            });

            current = addMonths(current, 1);
        }

        // 2. ARC Fee
        const passportExpiry = deployment.worker.passports[0]?.expiryDate;
        const validUnil = passportExpiry && isBefore(new Date(passportExpiry), endDate)
            ? new Date(passportExpiry)
            : endDate;

        const totalMonths = differenceInMonths(validUnil, startDate);
        const yearsRequired = Math.ceil(totalMonths / 12);

        // Fix for 0 years or negative
        const validYears = Math.max(1, yearsRequired);

        let arcDesc = `居留證 ${validYears} 年`;
        if (passportExpiry && isBefore(new Date(passportExpiry), endDate)) {
            arcDesc += ' (護照效期限制，需中途換發)';
        }

        items.push({
            billingDate: addMonths(startDate, 1),
            amount: validYears * 1000,
            itemCategory: 'ARC_FEE',
            status: 'GENERATED',
            description: arcDesc
        });

        // 3. Dormitory
        const bed = deployment.worker.bed;
        if (bed) {
            const dorm = bed.room.dormitory;
            const rent = dorm.rentFee || 0;
            const mgmt = dorm.managementFee || 0;
            const totalDorm = rent + mgmt;

            if (totalDorm > 0) {
                let loopDate = new Date(startDate);
                while (isBefore(loopDate, endDate) || isSameMonth(loopDate, endDate)) {
                    items.push({
                        billingDate: startOfMonth(loopDate),
                        amount: totalDorm,
                        itemCategory: 'DORMITORY_FEE',
                        status: 'GENERATED',
                        description: `租金:${rent} 管理:${mgmt}`
                    });
                    loopDate = addMonths(loopDate, 1);
                }
            }
        }

        // 4. Health Check
        const healthCheckDefault = 2000;
        const checkPoints = [6, 18, 30];
        checkPoints.forEach(monthOffset => {
            const checkDate = addMonths(startDate, monthOffset);
            if (isBefore(checkDate, endDate)) {
                items.push({
                    billingDate: addMonths(startDate, monthOffset - 1),
                    amount: healthCheckDefault,
                    itemCategory: 'HEALTH_CHECK_FEE',
                    status: 'GENERATED',
                    description: `定期體檢 (第${monthOffset}個月)`
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

        await prisma.billingPlan.deleteMany({
            where: { deploymentId, status: 'PENDING' }
        });

        const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

        return prisma.billingPlan.create({
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
     * Returns the 'Suggested Plan' items and 'Diff' indicators.
     */
    async simulatePlan(planId: string) {
        const existingPlan = await prisma.billingPlan.findUnique({
            where: { id: planId },
            include: { items: { orderBy: { billingDate: 'asc' } } }
        });

        if (!existingPlan) throw new Error('Plan not found');

        const deployment = await this.getDeploymentFull(existingPlan.deploymentId);
        if (!deployment) throw new Error('Deployment not found (for simulation)');

        const suggestedItems = await this.calculatePlanItems(deployment);

        // Compare Logic
        // We match items by [billingDate + itemCategory]. 
        // Note: Prisma Date objects might need handling

        const diffs = suggestedItems.map(suggested => {
            const suggestedDateStr = suggested.billingDate ? new Date(suggested.billingDate as any).toISOString().substring(0, 10) : '';

            const match = existingPlan.items.find(existing => {
                const existingDateStr = new Date(existing.billingDate).toISOString().substring(0, 10);
                return existingDateStr === suggestedDateStr && existing.itemCategory === suggested.itemCategory;
            });

            const suggestedAmt = suggested.amount || 0;
            const existingAmt = match ? match.amount : 0;

            // If match is null, it's a new item (Suggested only)
            // If match exists but amounts differ, it's modified
            // Items in existing but not in suggested? Need to handle those too?
            // For now, prompt asks for "Suggested vs Original". The UI usually shows "Suggested" list.

            return {
                ...suggested,
                existingAmount: match ? match.amount : null,
                isDifferent: match ? match.amount !== suggestedAmt : true, // If new item, different
                diffAmount: suggestedAmt - (match ? match.amount : 0)
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
        // Find active plan
        const plan = await prisma.billingPlan.findFirst({
            where: { deploymentId } // Simply find the one attached
        });

        if (plan && (plan.status === 'CONFIRMED' || plan.status === 'PENDING')) {
            await prisma.billingPlan.update({
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
