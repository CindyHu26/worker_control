import { Router } from 'express';
import prisma from '../prisma';
import { convertLeadToEmployer } from '../services/crmService';

const router = Router();

// GET /api/leads
router.get('/', async (req, res) => {
    try {
        const { status, assignedTo } = req.query;
        const where: any = {};
        if (status) where.status = String(status);
        if (assignedTo) where.assignedTo = String(assignedTo);

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignedUser: { select: { username: true, email: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// GET /api/leads/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const lead = await prisma.lead.findUnique({
            where: { id },
            include: {
                interactions: { orderBy: { date: 'desc' } },
                assignedUser: { select: { username: true, email: true } }
            }
        });
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// POST /api/leads
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Validation could be added here
        const lead = await prisma.lead.create({
            data: {
                ...data,
                status: 'NEW'
            }
        });
        res.json(lead);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// PATCH /api/leads/:id
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const lead = await prisma.lead.update({
            where: { id },
            data
        });
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// POST /api/leads/:id/interactions
router.post('/:id/interactions', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, summary, detailedNotes, outcome, date, nextFollowUpDate } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Interaction
            const interaction = await tx.leadInteraction.create({
                data: {
                    leadId: id,
                    type,
                    summary,
                    detailedNotes,
                    outcome,
                    date: date ? new Date(date) : new Date()
                }
            });

            // 2. Update Lead (Status logic can be here, or just timestamp)
            const updateData: any = {
                lastContactDate: new Date(),
                // If interaction happened, status might implicitly move to CONTACTED if it was NEW?
                // "Auto update lastContactDate" requested.
            };

            if (nextFollowUpDate) {
                updateData.nextFollowUpDate = new Date(nextFollowUpDate);
            }

            // Optional: Auto-status
            const lead = await tx.lead.findUnique({ where: { id } });
            if (lead?.status === 'NEW') {
                updateData.status = 'CONTACTED';
            }

            await tx.lead.update({
                where: { id },
                data: updateData
            });

            return interaction;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add interaction' });
    }
});

// POST /api/leads/:id/convert
router.post('/:id/convert', async (req, res) => {
    try {
        const { id } = req.params;
        // Assume user ID is available in req.user or similar middleware, otherwise pass in body or hardcode for now
        // For this prototype, we'll try to get it from a header or body, else fallback.
        // Assuming no auth middleware context in this snippet provided.
        const { operatorId, taxId, industryType, factoryAddress, avgDomesticWorkers } = req.body;
        const opId = operatorId || 'system';

        const employer = await convertLeadToEmployer(id, opId, {
            taxId,
            industryType,
            factoryAddress,
            avgDomesticWorkers: avgDomesticWorkers ? Number(avgDomesticWorkers) : undefined
        });
        res.json({ success: true, employer });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
