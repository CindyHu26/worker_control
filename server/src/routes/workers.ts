
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/workers
router.get('/', async (req, res) => {
    try {
        const {
            q,
            status,
            nationality,
            page = '1',
            limit = '10'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build Where Clause
        const whereClause: any = {};
        const andConditions = [];

        // 1. Keyword Search (Name, Passport, ARC)
        if (q) {
            const keyword = q as string;
            andConditions.push({
                OR: [
                    { englishName: { contains: keyword } }, // SQLite is case-insensitive by default for ASCII, but usually depends on collation
                    { chineseName: { contains: keyword } },
                    {
                        passports: {
                            some: { passportNumber: { contains: keyword } }
                        }
                    },
                    {
                        arcs: {
                            some: { arcNumber: { contains: keyword } }
                        }
                    }
                ]
            });
        }

        // 2. Exact Filters
        if (nationality) {
            andConditions.push({ nationality });
        }

        // Status Logic: Check if they have an active deployment
        if (status) {
            if (status === 'active') {
                andConditions.push({
                    deployments: {
                        some: { status: 'active' }
                    }
                });
            } else if (status === 'inactive') {
                andConditions.push({
                    deployments: {
                        none: { status: 'active' }
                    }
                });
            }
        }

        if (andConditions.length > 0) {
            whereClause.AND = andConditions;
        }

        // Execute Query with Pagination
        const [total, workers] = await Promise.all([
            prisma.worker.count({ where: whereClause }),
            prisma.worker.findMany({
                where: whereClause,
                include: {
                    deployments: {
                        where: { status: 'active' },
                        take: 1,
                        include: { employer: { select: { companyName: true } } }
                    },
                    passports: {
                        where: { isCurrent: true },
                        take: 1
                    }
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        res.json({
            data: workers,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Search Workers Error:', error);
        res.status(500).json({ error: 'Failed to search workers' });
    }
});

// GET /api/workers/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const worker = await prisma.worker.findUnique({
            where: { id },
            include: {
                // Documents
                passports: { orderBy: { issueDate: 'desc' } },
                arcs: { orderBy: { issueDate: 'desc' } },

                // Deployment & Timeline
                deployments: {
                    include: {
                        employer: true,
                        timelines: true, // WorkerTimeline
                        permitDetails: {
                            include: {
                                permitDocument: true
                            }
                        }
                    },
                    orderBy: { startDate: 'desc' }
                },

                // Incidents
                incidents: {
                    orderBy: { incidentDate: 'desc' }
                },

                // Other
                addressHistory: { orderBy: { startDate: 'desc' } },
                insurances: { orderBy: { startDate: 'desc' } }
            }
        });

        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json(worker);
    } catch (error) {
        console.error('Worker Detail Error:', error);
        res.status(500).json({ error: 'Failed to fetch worker details' });
    }
});

// POST /api/workers/:id/transfer
router.post('/:id/transfer', async (req, res) => {
    const { id } = req.params;
    const { newEmployerId, transferDate } = req.body; // YYYY-MM-DD

    if (!newEmployerId || !transferDate) {
        return res.status(400).json({ error: 'Missing defined parameters' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find Current Active Deployment
            const currentDeployment = await tx.deployment.findFirst({
                where: {
                    workerId: id,
                    status: 'active'
                }
            });

            // 2. Close it
            if (currentDeployment) {
                const newStart = new Date(transferDate);
                const oldEnd = new Date(newStart);
                oldEnd.setDate(oldEnd.getDate() - 1);

                await tx.deployment.update({
                    where: { id: currentDeployment.id },
                    data: {
                        status: 'ended',
                        serviceStatus: 'transferred_out',
                        endDate: oldEnd
                    }
                });
            }

            // 3. Create New Deployment
            const newDeployment = await tx.deployment.create({
                data: {
                    workerId: id,
                    employerId: newEmployerId,
                    startDate: new Date(transferDate),
                    status: 'active',
                    serviceStatus: 'active_service',
                    sourceType: 'transfer_in'
                }
            });

            return newDeployment;
        });

        res.json(result);
    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ error: 'Failed to process transfer' });
    }
});

// POST /api/workers/:id/arrange-entry
router.post('/:id/arrange-entry', async (req, res) => {
    const { id } = req.params;
    const { flightNumber, flightArrivalDate, pickupPerson } = req.body;

    if (!flightArrivalDate) {
        return res.status(400).json({ error: 'Flight arrival date is required' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Worker Info (Pickup Person)
            await tx.worker.update({
                where: { id },
                data: {
                    flightArrivalInfo: pickupPerson,
                }
            });

            // 2. Update Active/Pending Deployment (Flight Info triggers Timelines)
            // We find the latest one
            const currentDeployment = await tx.deployment.findFirst({
                where: {
                    workerId: id,
                    status: { in: ['active', 'pending'] }
                },
                orderBy: { startDate: 'desc' }
            });

            if (!currentDeployment) {
                throw new Error('No active or pending deployment found to arrange entry for.');
            }

            const updatedDeployment = await tx.deployment.update({
                where: { id: currentDeployment.id },
                data: {
                    flightNumber,
                    flightArrivalDate: new Date(flightArrivalDate),
                    entryDate: new Date(flightArrivalDate),
                }
            });

            return updatedDeployment;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Arrange Entry Error:', error);
        res.status(500).json({ error: error.message || 'Failed to arrange entry' });
    }
});

export default router;
