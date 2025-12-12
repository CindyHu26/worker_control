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

                // Pro-rata Calculation Logic
                const billingMonthStart = new Date(year, month - 1, 1);
                const billingMonthEnd = new Date(year, month, 0);
                const daysInMonth = billingMonthEnd.getDate();

                const serviceEndDate = d.endDate ? new Date(d.endDate) : null;

                // Check overlap - if not active in this month at all
                if (serviceStartDate > billingMonthEnd) continue;
                if (serviceEndDate && serviceEndDate < billingMonthStart) continue;

                const isStartInMonth = serviceStartDate.getFullYear() === year && (serviceStartDate.getMonth() + 1) === month;
                const isEndInMonth = serviceEndDate && serviceEndDate.getFullYear() === year && (serviceEndDate.getMonth() + 1) === month;

                let activeDays = 30; // Default standard denominator for full month

                if (isStartInMonth && isEndInMonth) {
                    activeDays = (serviceEndDate!.getDate() - serviceStartDate.getDate()) + 1;
                } else if (isStartInMonth) {
                    activeDays = (daysInMonth - serviceStartDate.getDate()) + 1;
                } else if (isEndInMonth) {
                    activeDays = serviceEndDate!.getDate();
                }

                let billAmount = Math.round(baseAmount * (activeDays / 30));
                let description = `${year}年${month}月 服務費 (第${diffMonths}個月) [$${baseAmount}]`;

                if (activeDays !== 30) {
                    description += ` (Pro-rata: ${activeDays} / 30 active days)`;
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
