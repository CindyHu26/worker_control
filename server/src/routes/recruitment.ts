
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// Get all Job Orders
router.get('/job-orders', async (req, res) => {
    try {
        const jobs = await prisma.jobOrder.findMany({
            include: {
                employer: {
                    select: {
                        companyName: true,
                        taxId: true
                    }
                },
                domesticRecruitment: true
            },
            orderBy: {
                orderDate: 'desc'
            }
        });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch job orders' });
    }
});

// Create Job Order
router.post('/job-orders', async (req, res) => {
    try {
        const { employerId, requiredWorkers, orderDate, domestic } = req.body;

        // Validation: Domestic Recruitment Info
        if (!domestic || !domestic.registryDate || !domestic.registryNumber || !domestic.laborViolationCertificateDate) {
            return res.status(400).json({
                error: 'Missing mandatory Domestic Recruitment Information (Registry Date, Registry Number, Labor Violation Certificate Date).'
            });
        }

        // Validation: 21 Days Rule
        const regDate = new Date(domestic.registryDate);
        const ordDate = new Date(orderDate);
        const laborCertDate = new Date(domestic.laborViolationCertificateDate);

        const diffTime = ordDate.getTime() - regDate.getTime();
        const diffDays = diffTime / (1000 * 3600 * 24);

        if (diffDays < 21) {
            return res.status(400).json({
                error: `Domestic Recruitment period invalid. Registry Date must be at least 21 days before Job Order Date. (Gap: ${Math.floor(diffDays)} days)`
            });
        }

        const newJob = await prisma.jobOrder.create({
            data: {
                employerId,
                requiredWorkers: Number(requiredWorkers),
                orderDate: ordDate,
                status: 'open',
                domesticRecruitment: {
                    create: {
                        registryDate: regDate,
                        registryNumber: domestic.registryNumber,
                        laborViolationCertificateDate: laborCertDate,
                        noViolationCertificateNumber: domestic.noViolationCertificateNumber
                    }
                }
            },
            include: {
                domesticRecruitment: true
            }
        });

        res.json(newJob);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create job order' });
    }
});

// Get Employers List (for Dropdown)
router.get('/employers/list', async (req, res) => {
    try {
        const employers = await prisma.employer.findMany({
            select: {
                id: true,
                companyName: true,
                taxId: true
            },
            orderBy: {
                companyName: 'asc'
            }
        });
        res.json(employers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employers' });
    }
});

export default router;
