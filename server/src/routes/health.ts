
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/health-checks
router.get('/', async (req, res) => {
    try {
        const { filter, days, types } = req.query; // types can be "6mo,18mo"
        const whereClause: any = {};
        const now = new Date();

        if (filter === 'upcoming') {
            const rangeDays = days ? Number(days) : 30; // Default 30
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + rangeDays);

            whereClause.checkDate = {
                gte: now,
                lte: futureDate
            };
            whereClause.result = 'pending';
        } else if (filter === 'overdue') {
            whereClause.checkDate = { lt: now };
            whereClause.result = 'pending';
        } else if (filter === 'history') {
            // Just show completed or all past
        }

        // Type Filtering
        if (types) {
            const typeList = (types as string).split(',');
            if (typeList.length > 0) {
                whereClause.checkType = { in: typeList };
            }
        }

        const checks = await prisma.healthCheck.findMany({
            where: whereClause,
            include: {
                worker: { select: { id: true, chineseName: true, englishName: true, mobilePhone: true } },
                deployment: { select: { employer: { select: { companyName: true } } } }
            },
            orderBy: { checkDate: 'asc' }
        });

        res.json(checks);
    } catch (error) {
        console.error('Fetch Health Checks Error:', error);
        res.status(500).json({ error: 'Failed to fetch health checks' });
    }
});

// GET /api/health-checks/:id 
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const check = await prisma.healthCheck.findUnique({
            where: { id },
            include: {
                worker: true,
                deployment: {
                    include: {
                        employer: true,
                        healthChecks: true // Fetch all checks for this deployment for timeline
                    }
                }
            }
        });

        if (!check) return res.status(404).json({ error: 'Not found' });

        // Fetch related comments (Tracking History)
        const comments = await prisma.systemComment.findMany({
            where: {
                recordId: id,
                recordTableName: 'health_checks'
            },
            include: { author: { select: { username: true, id: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ ...check, comments });
    } catch (error) {
        console.error('Get Health Check Detail Error:', error);
        res.status(500).json({ error: 'Failed to fetch details' });
    }
});

// POST /api/health-checks/:id/comments (Tracking Log)
router.post('/:id/comments', async (req, res) => {
    const { id } = req.params;
    const { content, userId } = req.body; // In real app, userId from session

    try {
        // Find a default user if none provided (for demo purposes)
        let authorId = userId;
        if (!authorId) {
            const defaultAccount = await prisma.internalUser.findFirst({
                where: { role: 'admin' }
            });
            if (defaultAccount) authorId = defaultAccount.id;
        }

        if (!authorId) return res.status(400).json({ error: 'No user context' });

        const comment = await prisma.systemComment.create({
            data: {
                recordId: id,
                recordTableName: 'health_checks',
                content,
                createdBy: authorId
            },
            include: { author: { select: { username: true } } }
        });

        res.json(comment);
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// POST /api/health-checks/batch-notify
router.post('/batch-notify', async (req, res) => {
    const { ids } = req.body; // Array of HealthCheck IDs
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid IDs' });
    }

    try {
        // Just a mock success for now as we don't have notification status in DB
        res.json({ message: `Successfully notified ${ids.length} workers.` });
    } catch (error) {
        console.error('Batch Notify Error:', error);
        res.status(500).json({ error: 'Failed to process batch notification' });
    }
});

// POST /api/health-checks/create-recheck
router.post('/create-recheck', async (req, res) => {
    const { parentHealthCheckId, checkDate } = req.body;

    try {
        const parent = await prisma.healthCheck.findUnique({ where: { id: parentHealthCheckId } });
        if (!parent) return res.status(404).json({ error: 'Parent record not found' });

        const recheck = await prisma.healthCheck.create({
            data: {
                workerId: parent.workerId,
                deploymentId: parent.deploymentId,
                checkType: 'supplementary', // Use existng enum value
                checkDate: new Date(checkDate),
                result: 'pending'
            }
        });

        res.json(recheck);
    } catch (error: any) {
        console.error('Create Recheck Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/health-checks/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        const updated = await prisma.healthCheck.update({
            where: { id },
            data: {
                hospitalName: body.hospitalName,
                reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
                result: body.result,
                failReason: body.failReason
            }
        });
        res.json(updated);
    } catch (error: any) {
        console.error('Update Health Check Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
