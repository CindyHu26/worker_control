
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/deployments
router.post('/', async (req, res) => {
    try {
        const {
            workerId,
            employerId,
            recruitmentLetterId,
            startDate,
            jobType
        } = req.body;

        if (!workerId || !employerId || !recruitmentLetterId || !startDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate Recruitment Letter Quota
            const letter = await tx.employerRecruitmentLetter.findUnique({
                where: { id: recruitmentLetterId }
            });

            if (!letter) {
                throw new Error('Recruitment Letter not found');
            }

            if (letter.employerId !== employerId) {
                throw new Error('Recruitment Letter does not belong to this employer');
            }

            if (letter.usedQuota >= letter.approvedQuota) {
                throw new Error('招募函名額已滿 (Recruitment Quota Exceeded)');
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
                    recruitmentLetterId,
                    startDate: new Date(startDate),
                    jobType: jobType || 'general',
                    status: 'active',
                    serviceStatus: 'active_service',
                    sourceType: 'direct_hiring' // or logic to determine
                }
            });

            // 4. Increment Quota
            await tx.employerRecruitmentLetter.update({
                where: { id: recruitmentLetterId },
                data: {
                    usedQuota: { increment: 1 }
                }
            });

            // 5. Initialize Worker Timeline (Empty or based on start date?)
            // If we have startDate, we can init some things, but Health Checks depend on Entry Date.
            // Let's create an empty timeline placeholder.
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
