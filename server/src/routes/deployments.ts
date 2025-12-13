
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/deployments
// POST /api/deployments
router.post('/', async (req, res) => {
    try {
        const {
            workerId,
            employerId,
            entryPermitId,
            startDate,
            jobType
        } = req.body;

        if (!workerId || !employerId || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate Entry Permit (If provided)
            if (entryPermitId) {
                const permit = await tx.entryPermit.findUnique({
                    where: { id: entryPermitId },
                    include: { recruitmentLetter: true }
                });

                if (!permit) {
                    throw new Error('Entry Permit not found');
                }

                if (permit.recruitmentLetter.employerId !== employerId) {
                    throw new Error('Entry Permit does not belong to this employer');
                }

                if (permit.usedCount >= permit.quota) {
                    throw new Error('入國通知人數已滿 (Entry Permit Quota Exceeded)');
                }

                // Increment Usage
                await tx.entryPermit.update({
                    where: { id: entryPermitId },
                    data: {
                        usedCount: { increment: 1 }
                    }
                });
            }

            // 2. Validate Worker Availability (Double check)
            const activeDeployment = await tx.deployment.findFirst({
                where: {
                    workerId,
                    status: 'active'
                }
            });

            if (activeDeployment) {
                throw new Error('Worker already has an active deployment');
            }

            // 3. Create Deployment
            const newDeployment = await tx.deployment.create({
                data: {
                    workerId,
                    employerId,
                    entryPermitId, // Updated field
                    startDate: new Date(startDate),
                    jobType: jobType || 'general',
                    status: 'active',
                    serviceStatus: 'active_service',
                    sourceType: 'direct_hiring'
                }
            });

            // 4. Initialize Worker Timeline
            await tx.workerTimeline.create({
                data: { deploymentId: newDeployment.id }
            });

            return newDeployment;
        });

        res.status(201).json(result);

    } catch (error: any) {
        console.error('Create Deployment Error:', error);
        res.status(400).json({ error: error.message || 'Failed to create deployment' });
    }
});

// POST /api/deployments/:id/terminate
router.post('/:id/terminate', async (req, res) => {
    try {
        const { id } = req.params;
        const { endDate, reason, notes } = req.body;

        if (!endDate || !reason) {
            return res.status(400).json({ error: 'End Date and Reason are required' });
        }

        // Logic Mapping
        let newStatus = 'ended';
        let newServiceStatus = 'completed';

        if (reason === 'runaway') {
            newStatus = 'runaway';
            newServiceStatus = 'runaway';
        } else if (reason === 'transferred_out') {
            newStatus = 'ended';
            newServiceStatus = 'transferred_out';
        } else if (reason === 'contract_terminated') {
            newServiceStatus = 'completed';
        }

        const updatedDeployment = await prisma.deployment.update({
            where: { id },
            data: {
                status: newStatus,
                serviceStatus: newServiceStatus,
                endDate: new Date(endDate),
                terminationReason: reason,
                terminationNotes: notes
            }
        });

        res.json(updatedDeployment);

    } catch (error: any) {
        console.error('Terminate Deployment Error:', error);
        res.status(500).json({ error: 'Failed to terminate deployment' });
    }
});

// POST /api/deployments/:id/generate-schedule
// Generates the Fee Schedule for the entire contract duration
router.post('/:id/generate-schedule', async (req, res) => {
    try {
        const { id } = req.params;
        const { overrideEndDate } = req.body;

        const deployment = await prisma.deployment.findUnique({
            where: { id },
            include: { monthlyFee: true }
        });

        if (!deployment) return res.status(404).json({ error: 'Deployment not found' });

        const startDate = deployment.entryDate ? new Date(deployment.entryDate) : new Date(deployment.startDate);

        let endDate: Date;
        if (overrideEndDate) {
            endDate = new Date(overrideEndDate);
        } else if (deployment.endDate) {
            endDate = new Date(deployment.endDate);
        } else {
            // Default to 3 years from start if no end date
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 3);
        }

        // Basic validation
        if (startDate > endDate) {
            return res.status(400).json({ error: 'Start date cannot be after end date' });
        }

        // Delete existing pending schedules to allow regeneration
        await prisma.feeSchedule.deleteMany({
            where: {
                deploymentId: id,
                status: 'pending'
            }
        });

        const schedules = [];
        let currentDate = new Date(startDate);
        // Normalize to 1st of month for billing cycle logic?
        // Or keep exact dates? 
        // Standard practice: Fee is due monthly relative to start.
        // E.g. Start Jan 15 -> Due Feb 15, Mar 15...
        // Let's iterate by adding months to the start date.

        let installment = 1;
        const fees = deployment.monthlyFee || { amountYear1: 1800, amountYear2: 1700, amountYear3: 1500 };

        while (currentDate <= endDate) {
            // Determine expected amount based on year
            // Year 1 (Months 1-12), Year 2 (13-24), Year 3 (25+)
            let amount = Number(fees.amountYear1);
            if (installment > 12 && installment <= 24) amount = Number(fees.amountYear2);
            else if (installment > 24) amount = Number(fees.amountYear3);

            // Don't generate if past the end date (edge case where loop condition might need check)
            // But we want to cover the period.

            schedules.push({
                deploymentId: id,
                installmentNo: installment,
                scheduleDate: new Date(currentDate),
                expectedAmount: amount,
                status: 'pending',
                description: `第 ${installment} 期服務費 (Year ${Math.ceil(installment / 12)})`
            });

            // Advance 1 month
            currentDate.setMonth(currentDate.getMonth() + 1);
            installment++;
        }

        // Batch Create
        await prisma.feeSchedule.createMany({
            data: schedules
        });

        res.json({
            success: true,
            count: schedules.length,
            period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`
        });

    } catch (error: any) {
        console.error('Generate Fee Schedule Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
