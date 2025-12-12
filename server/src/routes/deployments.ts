
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
                throw new Error('Recruitment Letter quota exceeded');
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

export default router;
