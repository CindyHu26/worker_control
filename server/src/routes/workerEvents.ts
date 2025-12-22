import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { WorkerEventType, DeploymentStatus, ServiceStatus } from '@prisma/client';

const router = Router();

// Schema
const WorkerEventSchema = z.object({
    workerId: z.string().uuid(),
    eventType: z.nativeEnum(WorkerEventType),
    eventDate: z.string().transform(str => new Date(str)),
    reportDate: z.string().transform(str => new Date(str)).optional(),
    bureauRefNumber: z.string().optional(),
    bureauRefDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
    notes: z.string().optional(),
    fileUrl: z.string().optional(),
});

// GET all events for a worker
router.get('/', async (req, res) => {
    const { workerId } = req.query;
    if (!workerId || typeof workerId !== 'string') {
        return res.status(400).json({ error: 'workerId is required' });
    }

    try {
        const events = await prisma.workerEvent.findMany({
            where: { workerId },
            orderBy: { eventDate: 'desc' }
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// CREATE Event & Update Status
router.post('/', async (req, res) => {
    try {
        const data = WorkerEventSchema.parse(req.body);

        // 1. Create Event
        const event = await prisma.workerEvent.create({
            data: {
                workerId: data.workerId,
                eventType: data.eventType,
                eventDate: data.eventDate,
                reportDate: data.reportDate,
                bureauRefNumber: data.bureauRefNumber,
                bureauRefDate: data.bureauRefDate,
                notes: data.notes,
                fileUrl: data.fileUrl,
            }
        });

        // 2. Derive Status Actions
        // Find active deployment
        const activeDeployment = await prisma.deployment.findFirst({
            where: {
                workerId: data.workerId,
                status: 'active'
            }
        });

        if (activeDeployment) {
            let deploymentUpdate: any = {};

            switch (data.eventType) {
                case 'RUNAWAY':
                    deploymentUpdate = {
                        status: DeploymentStatus.terminated,
                        serviceStatus: ServiceStatus.runaway,
                        terminationReason: 'Runaway',
                        terminationNotes: `Triggered by event on ${data.eventDate.toISOString()}`
                    };
                    break;
                case 'DEPARTURE':
                    deploymentUpdate = {
                        status: DeploymentStatus.ended,
                        serviceStatus: ServiceStatus.contract_terminated, // Or just ended?
                        terminationReason: 'Departure',
                        terminationNotes: `Triggered by event on ${data.eventDate.toISOString()}`
                    };
                    break;
                case 'TRANSFER_OUT':
                    deploymentUpdate = {
                        status: DeploymentStatus.terminated,
                        serviceStatus: ServiceStatus.transferred_out,
                        terminationReason: 'Transfer Out',
                        terminationNotes: `Triggered by event on ${data.eventDate.toISOString()}`
                    };
                    break;
                case 'DEATH':
                    deploymentUpdate = {
                        status: DeploymentStatus.terminated,
                        serviceStatus: ServiceStatus.commission_ended,
                        terminationReason: 'Death',
                        terminationNotes: `Triggered by event on ${data.eventDate.toISOString()}`
                    };
                    break;
            }

            if (Object.keys(deploymentUpdate).length > 0) {
                await prisma.deployment.update({
                    where: { id: activeDeployment.id },
                    data: deploymentUpdate
                });
            }
        }

        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to create event', details: error });
    }
});

// DELETE Event (Revert status? Complex. For now just delete)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.workerEvent.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
