import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

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
                // End date = Transfer Date - 1 day? Or same day transition?
                // Usually end date is the last day of work. Start date is first day of new work.
                // Let's assume Transfer Date is the START of the new job.
                const newStart = new Date(transferDate);
                const oldEnd = new Date(newStart);
                oldEnd.setDate(oldEnd.getDate() - 1);

                await tx.deployment.update({
                    where: { id: currentDeployment.id },
                    data: {
                        status: 'ended',
                        serviceStatus: 'transferred_out', // Should update service status too
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
                        // Clear old departure info if new entry? Maybe not needed yet.
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
                        entryDate: new Date(flightArrivalDate), // Assume Entry = Arrival for simplicity unless specified
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
