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
                const startDate = d.entryDate || d.startDate;
                if (!startDate) continue;

                const startYear = startDate.getFullYear();
                const startMonth = startDate.getMonth() + 1;

                // e.g. Entry: 2024-01-15. Bill: 2024-01. (2024-2024)*12 + (1-1) + 1 = 1st Month.
                const diffMonths = (year - startYear) * 12 + (month - startMonth) + 1;

                if (diffMonths <= 0) continue; // Not started yet for this billing month

                // Pick Fee Amount (Default or Custom)
                const fees = d.monthlyFee || { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500 };

                let amount = 0;
                if (diffMonths <= 12) amount = Number(fees.amountYear1);
                else if (diffMonths <= 24) amount = Number(fees.amountYear2);
                else amount = Number(fees.amountYear3);

                // Check if bill already exists for this Worker + Year + Month + Service Fee
                // To prevent double billing
                const exists = await tx.bill.findFirst({
                    where: {
                        workerId: d.workerId,
                        year: year,
                        month: month,
                        items: { some: { feeCategory: 'service_fee' } }
                    }
                });

                if (exists) continue;

                // Create Bill
                // Period: 1st of month to End of month
                const periodStart = new Date(year, month - 1, 1);
                const periodEnd = new Date(year, month, 0); // Last day of month

                await tx.bill.create({
                    data: {
                        billNo: `SF-${year}${String(month).padStart(2, '0')}-${d.workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId: d.workerId,
                        deploymentId: d.id,
                        year: year,
                        month: month,
                        billingDate: new Date(),
                        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)), // Due in 15 days
                        billingPeriodStart: periodStart,
                        billingPeriodEnd: periodEnd,
                        totalAmount: amount,
                        status: 'draft',
                        items: {
                            create: {
                                description: `${year}年${month}月 服務費 (第${diffMonths}個月)`,
                                amount: amount,
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
