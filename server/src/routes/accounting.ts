import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/accounting/generate-monthly-fees
router.post('/generate-monthly-fees', async (req, res) => {
    const { year, month } = req.body;

    // Validate inputs
    if (!year || !month) {
        return res.status(400).json({ error: 'Year and Month required' });
    }

    try {
        // 1. Find active deployments
        const deployments = await prisma.deployment.findMany({
            where: {
                status: 'active'
            },
            include: {
                monthlyFee: true,
                worker: true
            }
        });

        let generatedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const d of deployments) {
                // Determine start date logic: Entry Date preferred, else Start Date
                const serviceStartDate = d.entryDate ? new Date(d.entryDate) : new Date(d.startDate);
                if (!serviceStartDate) continue;

                const startYear = serviceStartDate.getFullYear();
                const startMonth = serviceStartDate.getMonth() + 1;

                // Contract Month Index (e.g., 1st month, 13th month)
                const diffMonths = (year - startYear) * 12 + (month - startMonth) + 1;

                if (diffMonths <= 0) continue; // Not started yet

                // Determine Base Monthly Fee
                const fees = d.monthlyFee || { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500 };
                let baseAmount = 0;
                if (diffMonths <= 12) baseAmount = Number(fees.amountYear1);
                else if (diffMonths <= 24) baseAmount = Number(fees.amountYear2);
                else baseAmount = Number(fees.amountYear3);

                // Pro-rata Calculation
                const billingMonthStart = new Date(year, month - 1, 1);
                const billingMonthEnd = new Date(year, month, 0);

                // Determine effective start/end within this month
                // Effective Start: Later of (BillingStart, ServiceStart)
                const effectiveStart = serviceStartDate > billingMonthStart ? serviceStartDate : billingMonthStart;

                // Effective End: Earlier of (BillingEnd, ServiceEnd)
                // Note: d.endDate might be null (active indefinitely)
                let effectiveEnd = billingMonthEnd;
                if (d.endDate) {
                    const svcEndDate = new Date(d.endDate);
                    if (svcEndDate < billingMonthEnd) {
                        effectiveEnd = svcEndDate;
                    }
                }

                if (effectiveStart > effectiveEnd) continue; // Not active in this month

                // Days Calculation (+1 inclusive)
                const oneDay = 24 * 60 * 60 * 1000;
                const activeDays = Math.round(Math.abs((effectiveEnd.getTime() - effectiveStart.getTime()) / oneDay)) + 1;

                // Standard agency practice: monthly fee calc often based on 30 days
                // If activeDays >= 30, full amount. 
                // If partial, (base * days / 30).

                let billAmount = baseAmount;
                let description = `${year}年${month}月 服務費 (第${diffMonths}個月)`;

                // Only apply pro-rata if < 30 days active in the month
                // OR if it's the very first month or very last month? 
                // The logic "activeDays < 30" covers both start/end partials and short months (Feb).
                // However, usually full month is full pay even if Feb (28 days).
                // Strict rule: If "Full Month Covered" (Service covers whole billing month), Pay Full.
                // If "Partial Cover" (Start mid-month or End mid-month), Pay Pro-rata.

                const isFullMonthCovered = serviceStartDate <= billingMonthStart && (!d.endDate || new Date(d.endDate) >= billingMonthEnd);

                if (!isFullMonthCovered && activeDays < 30) {
                    billAmount = Math.round((baseAmount * activeDays) / 30);
                    description += ` (Pro-rata: ${activeDays}/30 days)`;
                }

                // Check Existence
                const exists = await tx.bill.findFirst({
                    where: {
                        workerId: d.workerId,
                        year: year,
                        month: month,
                        items: { some: { feeCategory: 'service_fee' } }
                    }
                });

                if (exists) continue;

                await tx.bill.create({
                    data: {
                        billNo: `SF-${year}${String(month).padStart(2, '0')}-${d.workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId: d.workerId,
                        deploymentId: d.id,
                        year: year,
                        month: month,
                        billingDate: new Date(),
                        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
                        billingPeriodStart: billingMonthStart,
                        billingPeriodEnd: billingMonthEnd,
                        totalAmount: billAmount,
                        status: 'draft',
                        items: {
                            create: {
                                description: description,
                                amount: billAmount,
                                feeCategory: 'service_fee'
                            }
                        }
                    }
                });
                generatedCount++;
            }
        });

        res.json({ message: `Successfully generated ${generatedCount} bills.`, count: generatedCount });

    } catch (error: any) {
        console.error('Generate Fees Error:', error);
        res.status(500).json({ error: 'Failed to generate fees: ' + error.message });
    }
});

export default router;
