
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/recruitment/letters?employerId=...
router.get('/letters', async (req, res) => {
    try {
        const { employerId } = req.query;
        // if (!employerId) return res.status(400).json({ error: 'Employer ID required' }); // Allow all

        const where: any = {};
        if (employerId) {
            where.employerId = String(employerId);
        }

        const letters = await prisma.recruitmentLetter.findMany({
            where,
            include: {
                employer: { select: { companyName: true, companyNameEn: true } }, // Include employer info
                entryPermits: {
                    include: {
                        _count: { select: { deployments: true } }
                    }
                }
            },
            orderBy: { issueDate: 'desc' }
        });

        // Calculate usedQuota for letters based on permits? 
        // Or simply trust the `entryPermits` list. 
        // The prompt says "RecruitmentLetter.usedQuota should be the sum of quotas of all its EntryPermits."
        // We can do this calculation on read or rely on a stored field if we maintain it.
        // Let's rely on summing permits for "total allocated" and deployments for "total used".

        const result = letters.map(l => {
            const totalPermitQuota = l.entryPermits.reduce((sum, p) => sum + p.workerCount, 0);
            return {
                ...l,
                calculatedUsedQuota: totalPermitQuota // This is how much of the LETTER is used by Permits
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch letters' });
    }
});

// POST /api/recruitment/letters
router.post('/letters', async (req, res) => {
    try {
        const { employerId, letterNumber, issueDate, expiryDate, approvedQuota } = req.body;

        const letter = await prisma.recruitmentLetter.create({
            data: {
                employerId,
                letterNumber,
                issueDate: new Date(issueDate),
                expiryDate: new Date(expiryDate),
                approvedQuota: Number(approvedQuota)
            }
        });
        res.json(letter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create letter' });
    }
});

// POST /api/recruitment/letters/:id/permits
// POST /api/recruitment/letters/:id/permits
router.post('/letters/:id/permits', async (req, res) => {
    const { id } = req.params;
    const {
        permitNo,
        issueDate,
        expiryDate,
        workerCount,
        receiptNo,
        applicationDate,
        feeAmount,
        trNumber,
        attachmentPath
    } = req.body;

    // Default to 1 if not provided or invalid
    const countNum = workerCount ? Number(workerCount) : 1;
    if (isNaN(countNum) || countNum <= 0) {
        throw new Error('Invalid worker count');
    }

    try {
        await prisma.$transaction(async (tx) => {
            const letter = await tx.recruitmentLetter.findUnique({
                where: { id },
                include: { entryPermits: true }
            });
            if (!letter) throw new Error('Letter not found');

            // Check Quota
            const currentUsed = letter.entryPermits.reduce((sum, p) => sum + p.workerCount, 0); // usage should be sum of workerCount

            if (currentUsed + countNum > letter.approvedQuota) {
                throw new Error(`Quota exceeded. Remaining: ${letter.approvedQuota - currentUsed}`);
            }

            const permit = await tx.entryPermit.create({
                data: {
                    recruitmentLetterId: id,
                    permitNo,
                    issueDate: new Date(issueDate),
                    expiryDate: new Date(expiryDate),
                    workerCount: countNum,
                    receiptNo,
                    applicationDate: applicationDate ? new Date(applicationDate) : undefined,
                    feeAmount: feeAmount ? Number(feeAmount) : 0,
                    trNumber,
                    attachmentPath
                }
            });

            // Update letter usedQuota field
            await tx.recruitmentLetter.update({
                where: { id },
                data: { usedQuota: { increment: countNum } }
            });

            return permit;
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});


// --- Job Order Routes ---

// GET /api/recruitment/job-orders
router.get('/job-orders', async (req, res) => {
    try {
        const { employerId } = req.query;
        const where: any = {};
        if (employerId) {
            where.employerId = String(employerId);
        }

        const orders = await prisma.jobOrder.findMany({
            where,
            include: {
                employer: { select: { companyName: true, taxId: true } },
                jobRequisition: true
            },
            orderBy: { registryDate: 'desc' }
        });

        // Add calculated field for frontend (localRecruitmentDeadline)
        // Usually registryDate + 60 days
        const result = orders.map(o => {
            const deadline = new Date(o.registryDate);
            deadline.setDate(deadline.getDate() + 60);
            return {
                ...o,
                localRecruitmentDeadline: deadline.toISOString(),
                orderDate: o.registryDate.toISOString(), // Alias for frontend
                requiredWorkers: o.vacancyCount // Alias for frontend
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch job orders' });
    }
});

// POST /api/recruitment/job-orders
router.post('/job-orders', async (req, res) => {
    try {
        const { employerId, vacancyCount, orderDate, jobType } = req.body;

        const order = await prisma.jobOrder.create({
            data: {
                employerId,
                vacancyCount: Number(vacancyCount),
                registryDate: new Date(orderDate),
                jobType: jobType || 'FACTORY_WORKER',
                expiryDate: new Date(new Date(orderDate).getTime() + 60 * 24 * 60 * 60 * 1000), // Default 60 days
                status: 'active'
            }
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create job order' });
    }
});

// GET /api/recruitment/job-orders/:id
router.get('/job-orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.jobOrder.findUnique({
            where: { id },
            include: {
                employer: true,
                jobRequisition: true
            }
        });
        if (!order) return res.status(404).json({ error: 'Job order not found' });
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch job order' });
    }
});

// PUT /api/recruitment/job-orders/:id/requisition
router.put('/job-orders/:id/requisition', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const requisition = await prisma.jobRequisition.upsert({
            where: { jobOrderId: id },
            update: {
                skills: data.skills,
                salaryStructure: data.salaryStructure,
                leavePolicy: data.leavePolicy,
                workHours: data.workHours,
                accommodation: data.accommodation,
                otherRequirements: data.otherRequirements
            },
            create: {
                jobOrderId: id,
                skills: data.skills,
                salaryStructure: data.salaryStructure,
                leavePolicy: data.leavePolicy,
                workHours: data.workHours,
                accommodation: data.accommodation,
                otherRequirements: data.otherRequirements
            }
        });

        res.json(requisition);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update job requisition' });
    }
});

// GET /api/recruitment/employers/list
router.get('/employers/list', async (req, res) => {
    try {
        const employers = await prisma.employer.findMany({
            select: {
                id: true,
                companyName: true,
                taxId: true
            },
            orderBy: { companyName: 'asc' }
        });
        res.json(employers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employer list' });
    }
});

export default router;
