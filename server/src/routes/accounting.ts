import { Router } from 'express';
import prisma from '../prisma';
import { validateFeeCharge } from '../services/complianceService';

const router = Router();

/**
 * GET /api/accounting/bills
 * List bills with optional filters
 */
router.get('/bills', async (req, res) => {
    try {
        const { year, month, status, workerId } = req.query;

        const where: any = {};
        if (year) where.year = Number(year);
        if (month) where.month = Number(month);
        if (status && status !== 'all') where.status = String(status);
        if (workerId) where.workerId = String(workerId);

        const bills = await prisma.bill.findMany({
            where,
            include: {
                worker: { select: { chineseName: true, englishName: true } },
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(bills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bills' });
    }
});

/**
 * POST /api/accounting/generate-monthly-fees
 * Generates Monthly Bills based on FeeSchedule (Current + Arrears)
 */
router.post('/generate-monthly-fees', async (req, res) => {
    const { year, month } = req.body;

    if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid Year and Month (1-12) required' });
    }

    try {
        // Construct target range for CURRENT month's schedule
        const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const endOfMonth = new Date(Date.UTC(year, month, 1)); // Exclusive upper bound

        // Find relevant fee schedules for the current month
        const currentSchedules = await prisma.feeSchedule.findMany({
            where: {
                scheduleDate: {
                    gte: startOfMonth,
                    lt: endOfMonth
                },
                status: 'pending' // Only bill pending items
            },
            include: { deployment: true }
        });

        // Group by deploymentId to generate one bill per deployment
        const deploymentGroups = new Map<string, typeof currentSchedules>();
        for (const sch of currentSchedules) {
            const key = sch.deploymentId;
            if (!deploymentGroups.has(key)) deploymentGroups.set(key, []);
            deploymentGroups.get(key)?.push(sch);
        }

        let generatedCount = 0;
        const skippedReasons: string[] = [];

        await prisma.$transaction(async (tx) => {
            for (const [deploymentId, schedules] of deploymentGroups) {
                const deployment = schedules[0].deployment;
                const workerId = deployment.workerId;

                // 1. Calculate Current Amount
                let currentAmount = 0;
                const billItems = [];
                const scheduleIdsToLink: string[] = [];

                for (const sch of schedules) {
                    currentAmount += Number(sch.expectedAmount);
                    billItems.push({
                        description: sch.description || `Service Fee (Period ${sch.installmentNo})`,
                        amount: Number(sch.expectedAmount),
                        feeCategory: 'service_fee'
                    });
                    scheduleIdsToLink.push(sch.id);
                }

                // 2. Check Arrears (Previous Unpaid Schedules)
                // Find all schedules for this deployment BEFORE this month that are not paid
                const arrearsSchedules = await tx.feeSchedule.findMany({
                    where: {
                        deploymentId: deploymentId,
                        scheduleDate: { lt: startOfMonth },
                        status: { not: 'paid' }
                    }
                });

                let arrearsAmount = 0;
                for (const arr of arrearsSchedules) {
                    const outstanding = Number(arr.expectedAmount) - Number(arr.paidAmount);
                    if (outstanding > 0) {
                        arrearsAmount += outstanding;
                        // We link these too? Or just aggregate? 
                        // Let's aggregate for clean bill items but we technically "collect" for them.
                        // Linking might be cleaner for tracking.
                        scheduleIdsToLink.push(arr.id);
                    }
                }

                if (arrearsAmount > 0) {
                    billItems.push({
                        description: `前期未結餘額 (Arrears via ${arrearsSchedules.length} items)`,
                        amount: arrearsAmount,
                        feeCategory: 'arrears'
                    });
                }

                const totalAmount = currentAmount + arrearsAmount;

                if (totalAmount <= 0) {
                    skippedReasons.push(`Deployment ${deploymentId}: Total amount 0`);
                    continue; // Skip
                }

                // 3. Create Bill
                const newBill = await tx.bill.create({
                    data: {
                        billNo: `MTH-${year}${String(month).padStart(2, '0')}-${workerId.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId: workerId,
                        deploymentId: deploymentId,
                        year,
                        month,
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                        totalAmount,
                        balance: totalAmount, // Initial balance = total
                        status: 'draft',
                        items: {
                            create: billItems
                        }
                    }
                });

                // 4. Link FeeSchedules to this Bill
                // We update the 'billId' of the schedules. 
                // Note: If an arrears schedule already has a billId, this overwrite might imply re-billing.
                // For simplified flow, we allow "latest bill claims the schedule".
                await tx.feeSchedule.updateMany({
                    where: { id: { in: scheduleIdsToLink } },
                    data: { billId: newBill.id }
                });

                generatedCount++;
            }
        });

        res.json({
            message: `Generated ${generatedCount} bills`,
            generated: generatedCount,
            skipped: skippedReasons.length
        });

    } catch (error: any) {
        console.error('Generate Monthly Fees Error:', error);
        res.status(500).json({ error: 'Failed to generate fees: ' + error.message });
    }
});

/**
 * Utility to get Fee Amount based on Nationality
 */
async function getFeeAmount(name: string, nationality: string | null): Promise<number | null> {
    // 1. Try Specific Nationality Match
    if (nationality) {
        const specific = await prisma.feeItem.findFirst({
            where: { name, nationality }
        });
        if (specific) return Number(specific.defaultAmount);
    }

    // 2. Try Fallback (General/Null Nationality)
    const general = await prisma.feeItem.findFirst({
        where: { name, nationality: null }
    });

    if (general) return Number(general.defaultAmount);

    return null;
}

/**
 * POST /api/accounting/bills/create-fixed
 * Creates a ONE-TIME fixed fee bill (e.g., ARC, Medical, Passport)
 * No pro-rata calculation. Uses exact amount provided OR looks up standard fee.
 */
router.post('/bills/create-fixed', async (req, res) => {
    const { workerId, feeType, name, amount, description, billDate, overrideReason } = req.body;

    if (!workerId || (!amount && !name)) {
        return res.status(400).json({ error: 'Missing required fields: workerId. Either "amount" or "name" (for lookup) must be provided.' });
    }

    try {
        const worker = await prisma.worker.findUnique({
            where: { id: workerId },
            include: { deployments: { where: { status: 'active' } } }
        });

        if (!worker) return res.status(404).json({ error: 'Worker not found' });

        let finalAmount = amount ? Number(amount) : 0;
        let finalDesc = description;
        let feeItemIdToValidate = null;

        // Auto-populate amount if missing
        if (!amount && name) {
            // Need fee item ID for validation, let's fetch full item
            let feeItem = null;
            if (worker.nationality) {
                feeItem = await prisma.feeItem.findFirst({ where: { name, nationality: worker.nationality } });
            }
            if (!feeItem) {
                feeItem = await prisma.feeItem.findFirst({ where: { name, nationality: null } });
            }

            if (feeItem) {
                finalAmount = Number(feeItem.defaultAmount);
                if (!finalDesc) finalDesc = `${name} (${worker.nationality || 'General'})`;
                feeItemIdToValidate = feeItem.id;
            } else {
                return res.status(400).json({ error: `Fee standard not found for item: ${name} (Nationality: ${worker.nationality})` });
            }
        }

        // If feeType is provided but not name lookup, we might not have feeItemId.
        // Compliance check relies on feeItemId or we need a way to check purely by type/name.
        // Current service requires feeItemId. If manually entering amount, we might not use FeeItem logic or we must lookup?
        // Prompt implies "FeeItem" model has the flag.
        // If user creates ad-hoc item not linked to FeeItem, we can't check 'isZeroFeeSubject'.
        // Assumption: UI uses known fee items or backend maps 'feeType' to checks? 
        // Let's assume for now validation only runs if we matched a FeeItem.

        const billingDate = billDate ? new Date(billDate) : new Date();

        const activeDeployment = worker.deployments[0]; // Can be null if no active deployment
        // Need employerId for validation
        if (activeDeployment && feeItemIdToValidate) {
            const check = await validateFeeCharge(
                workerId,
                activeDeployment.employerId,
                feeItemIdToValidate,
                finalAmount,
                billingDate
            );

            if (check.isViolation) {
                if (!overrideReason) {
                    return res.status(200).json({ // Return 200 with soft warning to trigger Frontend Modal
                        requiresConfirmation: true,
                        warningMessage: check.message,
                        blockLevel: check.blockLevel
                    });
                }
                // If overridden, we proceed but log
            }
        }

        if (!finalDesc && name) finalDesc = name;
        if (!finalDesc) return res.status(400).json({ error: 'Description is required if not auto-generated.' });


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
                totalAmount: finalAmount,
                status: 'draft',
                items: {
                    create: {
                        description: finalDesc,
                        amount: finalAmount,
                        feeCategory: feeType || 'other_fee',
                        // Store compliance info
                        complianceOverrideReason: overrideReason || null,
                        isOverridden: !!overrideReason
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

/**
 * POST /api/accounting/bills/pay
 * Records a payment against a bill
 */
router.post('/bills/pay', async (req, res) => {
    const { billId, amount, paymentDate } = req.body;

    if (!billId || !amount) {
        return res.status(400).json({ error: 'Bill ID and Amount are required' });
    }

    const payAmount = Number(amount);

    if (payAmount <= 0) {
        return res.status(400).json({ error: 'Payment amount must be positive' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Bill (with linked Schedules)
            const bill = await tx.bill.findUnique({
                where: { id: billId },
                include: { feeSchedules: true }
            });

            if (!bill) throw new Error("Bill not found");

            // 2. Update Bill Balance
            const currentPaid = Number(bill.paidAmount);
            const total = Number(bill.totalAmount);
            const newPaid = currentPaid + payAmount;
            const newBalance = total - newPaid;

            // Update Bill Status
            let newStatus = bill.status;
            if (newBalance <= 0) newStatus = 'paid';
            else if (newPaid > 0) newStatus = 'partial';

            await tx.bill.update({
                where: { id: billId },
                data: {
                    paidAmount: newPaid,
                    balance: newBalance,
                    status: newStatus
                }
            });

            // 3. Allocate Payment to Linked FeeSchedules (FIFO / Waterfall)
            // Strategy: We have a "pool" of new money (payAmount) to distribute.
            // We look at all linked schedules. We should prioritize older ones? 
            // Or just distributed? 
            // Better strategy: We recalculate the status of schedules based on total cumulative payment?
            // "Waterfall": Iterate schedules, fill them up one by one with the TOTAL paid amount.

            // NOTE: This assumes this Bill is the ONLY source of payment for these schedules.
            // If we have re-linking logic, it gets complex. 
            // Simplified: Look at linked schedules, sort by date. Distribute `newPaid` across them.

            // Sort schedules by date to pay off arrears ID first
            const schedules = bill.feeSchedules.sort((a, b) =>
                new Date(a.scheduleDate).getTime() - new Date(b.scheduleDate).getTime()
            );

            let remainingToAllocate = newPaid;

            for (const sch of schedules) {
                const required = Number(sch.expectedAmount);
                // Currently paid for this specific schedule? 
                // We overwrite "paidAmount" based on the waterfall allocation of the BILL's total payment.
                // This means if I paid $1000 on the bill, the first schedule takes up to its amount, then next...

                let allocatable = 0;
                if (remainingToAllocate >= required) {
                    allocatable = required;
                    remainingToAllocate -= required;
                } else {
                    allocatable = remainingToAllocate;
                    remainingToAllocate = 0;
                }

                let schStatus = 'pending';
                if (allocatable >= required) schStatus = 'paid';
                else if (allocatable > 0) schStatus = 'partial';
                else schStatus = 'pending'; // or overdue

                await tx.feeSchedule.update({
                    where: { id: sch.id },
                    data: {
                        paidAmount: allocatable,
                        status: schStatus
                    }
                });
            }

            return {
                billId,
                newBalance,
                status: newStatus,
                message: newBalance > 0 ? `尚有欠款 $${newBalance} (Remaining Balance)` : 'Payment Complete'
            };
        });

        res.json(result);

    } catch (error: any) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ... (existing code)

/**
 * POST /api/accounting/generate-payroll-deductions
 * Generates Monthly Payroll Deduction Bills (Insurance + Tax)
 */
router.post('/generate-payroll-deductions', async (req, res) => {
    const { year, month } = req.body; // e.g., 2025, 5

    if (!year || !month) {
        return res.status(400).json({ error: 'Year and Month required' });
    }

    try {
        // 1. Get active deployments
        // We assume "active" deployments need deductions
        const deployments = await prisma.deployment.findMany({
            where: { status: 'active', entryDate: { not: null } },
            include: { worker: true, employer: true }
        });

        // 2. Get Insurance Tiers
        const tiers = await prisma.insuranceTier.findMany({
            where: { isActive: true },
            orderBy: { grade: 'asc' }
        });

        const minWageTier = tiers[0];
        const minWage = minWageTier ? Number(minWageTier.maxSalary) : 27470; // Fallback

        let generatedCount = 0;

        await prisma.$transaction(async (tx) => {
            for (const d of deployments) {
                const salary = d.basicSalary ? Number(d.basicSalary) : minWage;
                const worker = d.worker;

                const billItems = [];

                // A. Insurance
                const tier = tiers.find(t => salary >= Number(t.minSalary) && salary <= Number(t.maxSalary));

                // Fallback to highest/lowest if out of range? Or specific error?
                // We'll use the found tier or the default minWageTier
                const selectedTier = tier || minWageTier;

                if (selectedTier) {
                    billItems.push({
                        description: `勞保費 (Labor Insurance) - Grade ${selectedTier.grade}`,
                        amount: Number(selectedTier.laborFee),
                        feeCategory: 'labor_insurance'
                    });
                    billItems.push({
                        description: `健保費 (Health Insurance) - Grade ${selectedTier.grade}`,
                        amount: Number(selectedTier.healthFee),
                        feeCategory: 'health_insurance'
                    });
                }

                // B. Tax Logic
                let taxRate = 0.05; // Default Resident Rate
                let taxDesc = "Tax (Resident 5%)";

                if (!worker.isTaxResident) {
                    // Non-Resident Logic
                    // Threshold: 1.5 * Min Wage
                    const threshold = minWage * 1.5;
                    if (salary <= threshold) {
                        taxRate = 0.06;
                        taxDesc = "Tax (Non-Resident Low Salary 6%)";
                    } else {
                        taxRate = 0.18;
                        taxDesc = "Tax (Non-Resident High Salary 18%)";
                    }
                }

                const taxAmount = Math.floor(salary * taxRate);
                if (taxAmount > 0) {
                    billItems.push({
                        description: `${taxDesc} - Base: ${salary}`,
                        amount: taxAmount,
                        feeCategory: 'tax'
                    });
                }

                if (billItems.length === 0) continue;

                const totalAmount = billItems.reduce((sum, item) => sum + item.amount, 0);

                // C. Create Bill
                await tx.bill.create({
                    data: {
                        billNo: `PAY-${year}${String(month).padStart(2, '0')}-${worker.id.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                        payerType: 'worker',
                        workerId: worker.id,
                        deploymentId: d.id,
                        year,
                        month,
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days
                        totalAmount,
                        balance: totalAmount,
                        status: 'draft',
                        items: {
                            create: billItems
                        }
                    }
                });

                generatedCount++;
            }
        });

        res.json({ message: `Generated ${generatedCount} payroll deduction bills.` });

    } catch (error: any) {
        console.error('Payroll Generation Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/accounting/bills/:id
 * Get bill detail with invoice information
 */
router.get('/bills/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const bill = await prisma.bill.findUnique({
            where: { id },
            include: {
                worker: {
                    select: {
                        id: true,
                        chineseName: true,
                        englishName: true
                    }
                },
                employer: {
                    select: {
                        id: true,
                        companyName: true,
                        taxId: true
                    }
                },
                items: true,
                invoice: true
            }
        });

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        res.json(bill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch bill detail' });
    }
});

/**
 * POST /api/accounting/bills/:id/issue-invoice
 * Issue an electronic invoice for a bill via ECPay
 */
router.post('/bills/:id/issue-invoice', async (req, res) => {
    try {
        const { id } = req.params;
        const { printMark, carrierType, carrierId, donation, donationCode } = req.body;

        // 1. Fetch Bill
        const bill = await prisma.bill.findUnique({
            where: { id },
            include: {
                worker: true,
                employer: true,
                items: true,
                invoice: true
            }
        });

        if (!bill) {
            return res.status(404).json({ error: 'Bill not found' });
        }

        // Check if invoice already exists
        if (bill.invoice) {
            return res.status(400).json({ error: 'Invoice already issued for this bill' });
        }

        // Check bill status
        if (bill.status === 'cancelled') {
            return res.status(400).json({ error: 'Cannot issue invoice for cancelled bill' });
        }

        // 2. Prepare Invoice Data
        // In a real implementation, you would call ECPay API here
        // For now, we'll create a mock invoice

        const invoiceNumber = `AB${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${Math.random().toString().substring(2, 10)}`;
        const randomCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Determine buyer info
        let buyerName = '';
        let buyerIdentifier = '';

        if (bill.payerType === 'employer' && bill.employer) {
            buyerName = bill.employer.companyName;
            buyerIdentifier = bill.employer.taxId;
        } else if (bill.payerType === 'worker' && bill.worker) {
            buyerName = bill.worker.chineseName || bill.worker.englishName;
            // Workers typically don't have tax ID for B2C invoices
        }

        // 3. Create Invoice Record
        const invoice = await prisma.invoice.create({
            data: {
                billId: bill.id,
                invoiceNumber,
                invoiceDate: new Date(),
                status: 'issued',
                randomCode,
                totalAmount: bill.totalAmount,
                buyerName,
                buyerIdentifier,
                carrierType: carrierType || null,
                carrierId: carrierId || null,
                donationCode: donationCode || null,
                printMark: printMark || 'N'
            }
        });

        // 4. Update Bill Status
        await prisma.bill.update({
            where: { id: bill.id },
            data: {
                status: bill.status === 'draft' ? 'issued' : bill.status,
                invoiceNumber: invoiceNumber
            }
        });

        res.json({
            message: 'Invoice issued successfully',
            invoiceNumber: invoice.invoiceNumber,
            invoice
        });

    } catch (error: any) {
        console.error('Invoice Issuance Error:', error);
        res.status(500).json({ error: error.message || 'Failed to issue invoice' });
    }
});

export default router;
