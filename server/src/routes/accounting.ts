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
                const serviceEndDate = d.endDate ? new Date(d.endDate) : null;

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
                const billingMonthEnd = new Date(year, month, 0); // Last day of previous month? NO. 
                // new Date(year, month, 0) gives the last day of the 'month' (1-indexed input in Date constructor is 0 for Jan? No.)
                // Date(year, monthIndex, day)
                // month input from user is 1-12.
                // billingMonthStart: Date(year, month-1, 1). Correct.
                // billingMonthEnd: new Date(year, month-1 + 1, 0) => new Date(year, month, 0). Correct.

                // 1. Effective Start
                let effectiveStart = serviceStartDate < billingMonthStart ? billingMonthStart : serviceStartDate;

                // 2. Effective End
                // If serviceEndDate is null, it means indefinite -> use EOM
                // If serviceEndDate is present, take min(serviceEndDate, EOM)
                let effectiveEnd = billingMonthEnd;
                if (serviceEndDate) {
                    effectiveEnd = serviceEndDate < billingMonthEnd ? serviceEndDate : billingMonthEnd;
                }

                // 3. Billable Days
                // Calculate difference in milliseconds
                const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
                // Convert to days. +1 because inclusive (e.g. 1st to 1st is 1 day)
                const billableDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (billableDays <= 0) continue;

                // 4. Calculate Amount
                // Rule: (MonthlyFee / 30) * billableDays. Round to integer.
                const billAmount = Math.round((baseAmount / 30) * billableDays);

                // 5. Description
                let description = `${year}/${String(month).padStart(2, '0')} Service Fee (${billableDays} days)`;
                if (billableDays < 30) {
                    // Optional: Add note if not full month, though "X days" implies it.
                    // User requested specific description format: "2024/05 Service Fee (15 days)"
                    // My constructed string matches this format.
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
