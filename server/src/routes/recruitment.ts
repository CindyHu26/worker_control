
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
                }
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
        const { employerId, requiredWorkers, orderDate } = req.body;

        const newJob = await prisma.jobOrder.create({
            data: {
                employerId,
                requiredWorkers: Number(requiredWorkers),
                orderDate: new Date(orderDate),
                status: 'open',
                // Trigger will calculate localRecruitmentDeadline automatically
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
