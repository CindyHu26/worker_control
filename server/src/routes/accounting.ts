import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/accounting/generate-monthly-fees
// Taiwan-Compliant Pro-Rata Billing Engine
router.post('/generate-monthly-fees', async (req, res) => {
    const { year, month } = req.body;

    // Validate inputs
    if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid Year and Month (1-12) required' });
    }

    try {
        // 1. Define Target Billing Period
        const targetMonthStart = new Date(year, month - 1, 1); // TMS: 1st of month
        const targetMonthEnd = new Date(year, month, 0); // TME: Last day of month
        const daysInMonth = targetMonthEnd.getDate(); // DIM: Total days in month

        // 2. Find all active deployments
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
        const skippedDeployments: string[] = [];

        await prisma.$transaction(async (tx) => {
            for (const deployment of deployments) {
                const { id: deploymentId, workerId, startDate, entryDate, endDate, monthlyFee } = deployment;

                // === STEP 1: Determine EffectiveStart ===
                // EffectiveStart = Max(TMS, Deployment.startDate, Deployment.entryDate)
                const candidateDates = [
                    targetMonthStart,
                    new Date(startDate),
                    entryDate ? new Date(entryDate) : null
                ].filter(Boolean) as Date[];

                const effectiveStart = new Date(Math.max(...candidateDates.map(d => d.getTime())));

                // === STEP 2: Determine EffectiveEnd ===
                // EffectiveEnd = Min(TME, Deployment.endDate OR TME)
                const effectiveEnd = endDate
                    ? new Date(Math.min(new Date(endDate).getTime(), targetMonthEnd.getTime()))
                    : targetMonthEnd;

                // === STEP 3: Calculate ActiveDays ===
                // ActiveDays = (EffectiveEnd - EffectiveStart) in days + 1 (inclusive)
                const millisecondsDiff = effectiveEnd.getTime() - effectiveStart.getTime();
                const activeDays = Math.floor(millisecondsDiff / (1000 * 60 * 60 * 24)) + 1;

                // === CONDITION: Skip if ActiveDays <= 0 ===
                if (activeDays <= 0) {
                    skippedDeployments.push(`Worker ${workerId.substring(0, 8)}: ${activeDays} days (not billable)`);
                    continue;
                }

                // === STEP 4: Determine Monthly Fee (Year-Based Tiering) ===
                const serviceStart = entryDate ? new Date(entryDate) : new Date(startDate);
                const contractMonths = (year - serviceStart.getFullYear()) * 12 + (month - (serviceStart.getMonth() + 1)) + 1;

                const fees = monthlyFee || { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500 };
                let monthlyRate = 0;
                if (contractMonths <= 12) monthlyRate = Number(fees.amountYear1);
                else if (contractMonths <= 24) monthlyRate = Number(fees.amountYear2);
                else monthlyRate = Number(fees.amountYear3);

                // === STEP 5: Calculate Bill Amount ===
                let billAmount: number;

                if (activeDays >= 30) {
                    // Exception: If ActiveDays >= 30, charge full MonthlyFee
                    billAmount = monthlyRate;
                } else {
                    // Standard: DailyRate = MonthlyFee / 30
                    const dailyRate = monthlyRate / 30;
                    billAmount = Math.round(dailyRate * activeDays);
                }

                // === STEP 6: Build Bill Description ===
                const description = `${year}/${String(month).padStart(2, '0')} 服務費 (Active: ${activeDays} days)`;

                // === STEP 7: Check if bill already exists ===
                const existingBill = await tx.bill.findFirst({
                    where: {
                        workerId,
                        year,
                        month,
                        items: { some: { feeCategory: 'service_fee' } }
                    }
                });

                if (existingBill) {
                    skippedDeployments.push(`Worker ${workerId.substring(0, 8)}: Bill already exists`);
                    continue;
                }

                // === STEP 8: Create Bill ===
                await tx.bill.create({
                    data: {
                        billNo: `SF-${year}${String(month).padStart(2, '0')}-${workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId,
                        deploymentId,
                        year,
                        month,
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // +15 days
                        billingPeriodStart: targetMonthStart,
                        billingPeriodEnd: targetMonthEnd,
                        totalAmount: billAmount,
                        status: 'draft',
                        items: {
                            create: {
                                description,
                                amount: billAmount,
                                feeCategory: 'service_fee'
                            }
                        }
                    }
                });

                generatedCount++;
            }
        });

        res.json({
            message: `Successfully generated ${generatedCount} bills for ${year}/${String(month).padStart(2, '0')}`,
            generated: generatedCount,
            skipped: skippedDeployments.length,
            skippedReasons: skippedDeployments
        });

    } catch (error: any) {
        console.error('Generate Monthly Fees Error:', error);
        res.status(500).json({ error: 'Failed to generate fees: ' + error.message });
    }
});

export default router;
