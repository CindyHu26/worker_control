
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

        // Assuming 'leads' was meant to be 'deployments' for these aggregations
        // and that 'industry' and 'status' properties exist on deployment objects.
        // If 'leads' is a separate data source, it needs to be fetched or defined.
        const categoryStats = deployments.reduce((acc: any, lead: any) => { // Changed 'lead' to 'deployment' for clarity, but kept 'lead' as per instruction
            const industry = lead.industry || 'Uncategorized'; // Assuming deployment has an 'industry' property
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
        }, {});

        const statusStats = deployments.reduce((acc: any, lead: any) => { // Changed 'lead' to 'deployment' for clarity, but kept 'lead' as per instruction
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
        }, {});


        // Group by processStage
        const board = {
            recruitment: deployments.filter((d: any) => d.processStage === 'recruitment'),
            visa_processing: deployments.filter((d: any) => d.processStage === 'visa_processing'),
            flight_booking: deployments.filter((d: any) => d.processStage === 'flight_booking'),
            arrival: deployments.filter((d: any) => d.processStage === 'arrival'),
            medical_check: deployments.filter((d: any) => d.processStage === 'medical_check')
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
            updateData.flightArrivalDate = entryDate;

            // WorkerTimeline removed from schema
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
