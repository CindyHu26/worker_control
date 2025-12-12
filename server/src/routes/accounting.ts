import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

/**
 * POST /api/accounting/generate-monthly-fees
 * Generates RECURRING monthly fees (Service Fee, Accommodation Fee)
 * Uses strict pro-rata logic: Amount = Round(MonthlyFee * (ActiveDays / 30))
 */
router.post('/generate-monthly-fees', async (req, res) => {
    const { year, month } = req.body;

    // Validate inputs
    if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid Year and Month (1-12) required' });
    }

    try {
        // 1. Define Target Billing Period (Use UTC to match Prisma)
        const targetMonthStart = new Date(Date.UTC(year, month - 1, 1)); // 1st of month UTC
        const targetMonthEnd = new Date(Date.UTC(year, month, 0)); // Last day of month UTC

        // 2. Find all active deployments
        // We consider deployments that overlap with our target month
        // status='active' is a good basic filter, but we might want to double check logic if they ended mid-month but status is still active? 
        // For now, reliance on status='active' + endDate check is standard.
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
                const { id: deploymentId, workerId, startDate, endDate, monthlyFee } = deployment;

                // === STEP 1: Determine Effective Dates ===
                // Start = Max(MonthStart, DeploymentStart)
                const startDates = [targetMonthStart, new Date(startDate)];
                const effectiveStart = new Date(Math.max(...startDates.map(d => d.getTime())));

                // End = Min(MonthEnd, DeploymentEnd (if exists))
                const endDates = [targetMonthEnd];
                if (endDate) endDates.push(new Date(endDate));
                const effectiveEnd = new Date(Math.min(...endDates.map(d => d.getTime())));

                // === STEP 2: Calculate Active Days ===
                // Difference in milliseconds
                const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
                // Convert to days and add 1 (inclusive)
                const activeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (activeDays <= 0) {
                    skippedDeployments.push(`Worker ${workerId.substring(0, 8)}: ${activeDays} days (not billable)`);
                    continue;
                }

                // === STEP 3: Determine Fee Rates ===
                // Service Fee (Tiered by year)
                // We calculate "Contract Year" based on startDate
                const serviceStart = new Date(startDate);
                // Simple approx for contract year: 
                // Months elapsed = (TargetYear - StartYear)*12 + (TargetMonth - StartMonth)
                // If months < 12 => Year 1, < 24 => Year 2, etc.
                const monthsElapsed = (year - serviceStart.getFullYear()) * 12 + (month - (serviceStart.getMonth() + 1));

                const fees = monthlyFee || { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500, accommodationFee: 0 };

                let serviceFeeRate = 0;
                if (monthsElapsed < 12) serviceFeeRate = Number(fees.amountYear1);
                else if (monthsElapsed < 24) serviceFeeRate = Number(fees.amountYear2);
                else serviceFeeRate = Number(fees.amountYear3);

                const accommodationFeeRate = Number(fees.accommodationFee || 0);

                // === STEP 4: Calculate Bill Amounts (Pro-Rata) ===
                // Formula: Round(Rate * (ActiveDays / 30))

                const serviceFeeAmount = Math.round(serviceFeeRate * (activeDays / 30));
                const accommodationFeeAmount = Math.round(accommodationFeeRate * (activeDays / 30));

                if (serviceFeeAmount <= 0 && accommodationFeeAmount <= 0) {
                    skippedDeployments.push(`Worker ${workerId.substring(0, 8)}: Amounts are 0`);
                    continue;
                }

                // === STEP 5: Check Duplicate Bill ===
                // We check if we already billed this worker for this month/year with service/accom fees
                const existingBill = await tx.bill.findFirst({
                    where: {
                        workerId,
                        year,
                        month,
                        items: {
                            some: {
                                feeCategory: {
                                    in: ['service_fee', 'accommodation_fee']
                                }
                            }
                        }
                    }
                });

                if (existingBill) {
                    skippedDeployments.push(`Worker ${workerId.substring(0, 8)}: Bill already exists`);
                    continue;
                }

                // === STEP 6: Create Bill Items ===
                const itemsToCreate = [];

                if (serviceFeeAmount > 0) {
                    itemsToCreate.push({
                        description: `${year}/${String(month).padStart(2, '0')} 服務費 (在職: ${activeDays}天)`,
                        amount: serviceFeeAmount,
                        feeCategory: 'service_fee'
                    });
                }

                if (accommodationFeeAmount > 0) {
                    itemsToCreate.push({
                        description: `${year}/${String(month).padStart(2, '0')} 住宿費 (在職: ${activeDays}天)`,
                        amount: accommodationFeeAmount,
                        feeCategory: 'accommodation_fee'
                    });
                }

                // === STEP 7: Create Bill ===
                const totalBillAmount = serviceFeeAmount + accommodationFeeAmount;

                await tx.bill.create({
                    data: {
                        billNo: `MTH-${year}${String(month).padStart(2, '0')}-${workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId,
                        deploymentId,
                        year,
                        month,
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Due in 15 days
                        billingPeriodStart: effectiveStart,
                        billingPeriodEnd: effectiveEnd,
                        totalAmount: totalBillAmount,
                        status: 'draft',
                        items: {
                            create: itemsToCreate
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

/**
 * POST /api/accounting/bills/create-fixed
 * Creates a ONE-TIME fixed fee bill (e.g., ARC, Medical, Passport)
 * No pro-rata calculation. Uses exact amount provided.
 */
router.post('/bills/create-fixed', async (req, res) => {
    const { workerId, feeType, amount, description, billDate } = req.body;

    if (!workerId || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields: workerId, amount, description' });
    }

    try {
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: { deployments: { where: { status: 'active' } } }
        });

        if (!worker) return res.status(404).json({ error: 'Worker not found' });

        const activeDeployment = worker.deployments[0]; // Can be null if no active deployment
        const billingDate = billDate ? new Date(billDate) : new Date();
        const year = billingDate.getFullYear();
        const month = billingDate.getMonth() + 1;

        const bill = await prisma.bill.create({
            data: {
                billNo: `FIX-${year}${String(month).padStart(2, '0')}-${workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                payerType: 'worker',
                workerId,
                deploymentId: activeDeployment?.id, // Optional link
                year,
                month,
                billingDate: billingDate,
                dueDate: new Date(billingDate.getTime() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days default
                totalAmount: Number(amount),
                status: 'draft',
                items: {
                    create: {
                        description,
                        amount: Number(amount),
                        feeCategory: feeType || 'other_fee'
                    }
                }
            }
        });

        res.json(bill);
    } catch (error: any) {
        console.error('Create Fixed Bill Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
