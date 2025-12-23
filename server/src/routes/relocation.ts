import { Router } from 'express';
import prisma from '../prisma';
import { relocateWorker, getAccommodationHistory } from '../services/accommodationService';

const router = Router();

// POST /api/relocation
// Relocate a worker
router.post('/', async (req, res, next) => {
    try {
        const { workerId, newLocation, effectiveDate } = req.body;
        // newLocation: { bedId?: string, address?: string }

        if (!workerId || !effectiveDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!newLocation || (!newLocation.bedId && !newLocation.address)) {
            return res.status(400).json({ error: 'Must provide either bedId or address' });
        }

        const history = await relocateWorker(workerId, newLocation, effectiveDate);
        res.status(201).json(history);

    } catch (error: any) {
        next(error);
    }
});

// GET /api/relocation/worker/:workerId
// Get accommodation history
router.get('/worker/:workerId', async (req, res, next) => {
    try {
        const { workerId } = req.params;
        const history = await getAccommodationHistory(workerId);
        res.json(history);
    } catch (error: any) {
        next(error);
    }
});

// GET /api/relocation/notifications
// Get tracking list
router.get('/notifications', async (req, res, next) => {
    try {
        const { status, workerId } = req.query;
        const where: any = {};
        if (status) {
            where.status = String(status);
        }
        if (workerId) {
            where.workerId = String(workerId);
        }

        const notifications = await prisma.relocationNotification.findMany({
            where,
            include: {
                worker: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(notifications);
    } catch (error: any) {
        next(error);
    }
});

// PATCH /api/relocation/notifications/:id
// Update tracking status
router.patch('/notifications/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const updated = await prisma.relocationNotification.update({
            where: { id },
            data: {
                mailingDate: data.mailingDate ? new Date(data.mailingDate) : undefined,
                filingDate: data.filingDate ? new Date(data.filingDate) : undefined,
                receiptDate: data.receiptDate ? new Date(data.receiptDate) : undefined,
                receiptNumber: data.receiptNumber,
                status: data.status,
                notes: data.notes
            }
        });
        res.json(updated);
    } catch (error: any) {
        next(error);
    }
});

export default router;
