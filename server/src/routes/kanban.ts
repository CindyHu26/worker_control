
import { Router } from 'express';
import prisma from '../prisma';
import { addDays } from 'date-fns';

const router = Router();

/**
 * GET /api/kanban/board
 * Fetch deployments grouped by status for Kanban Board
 */
router.get('/board', async (req, res) => {
    try {
        const deployments = await prisma.deployment.findMany({
            where: {
                status: 'active'
            },
            include: {
                worker: true,
                employer: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Group by processStage
        const board = {
            recruitment: deployments.filter(d => d.processStage === 'recruitment'),
            visa_processing: deployments.filter(d => d.processStage === 'visa_processing'),
            flight_booking: deployments.filter(d => d.processStage === 'flight_booking'),
            arrival: deployments.filter(d => d.processStage === 'arrival'),
            medical_check: deployments.filter(d => d.processStage === 'medical_check')
        };

        res.json(board);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch kanban board' });
    }
});

/**
 * PATCH /api/kanban/cards/:id/move
 * Move card to new stage and handle side effects
 */
router.patch('/cards/:id/move', async (req, res) => {
    try {
        const { id } = req.params;
        const { stage, flightInfo } = req.body;

        if (!['recruitment', 'visa_processing', 'flight_booking', 'arrival', 'medical_check'].includes(stage)) {
            return res.status(400).json({ error: 'Invalid stage' });
        }

        const updateData: any = {
            processStage: stage
        };

        // Side Effects Logic
        if (stage === 'arrival' && flightInfo) {
            const entryDate = new Date(flightInfo.arrivalDate);
            updateData.entryDate = entryDate;
            updateData.flightNumber = flightInfo.flightNumber;
            updateData.flightArrivalDate = entryDate; // Duplicate for now as schema has both

            // Auto-calculate medical check deadline (Entry + 3 days)
            // Save to WorkerTimeline if exists, or create new?
            // Let's upsert WorkerTimeline

            const medCheckDeadline = addDays(entryDate, 3);

            await prisma.workerTimeline.upsert({
                where: { deploymentId: id },
                create: {
                    deploymentId: id,
                    entryMedCheckDeadline: medCheckDeadline
                },
                update: {
                    entryMedCheckDeadline: medCheckDeadline
                }
            });
        }

        const updatedDeployment = await prisma.deployment.update({
            where: { id },
            data: updateData
        });

        res.json(updatedDeployment);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to move card' });
    }
});

export default router;
