import express from 'express';
import { z } from 'zod';
import { runawayService } from '../services/runawayService';
import { RunawayStatus } from '@prisma/client';
import { AppError } from '../types/errors';

const router = express.Router();

/**
 * GET /api/runaways
 * List runaway records
 */
router.get('/', async (req, res, next) => {
    try {
        const filters = {
            status: req.query.status as RunawayStatus,
            employerId: req.query.employerId as string,
            search: req.query.search as string
        };
        const records = await runawayService.listRecords(filters);
        res.json(records);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/runaways/:id
 * Get record details
 */
router.get('/:id', async (req, res, next) => {
    try {
        const record = await runawayService.getRecord(req.params.id);
        res.json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/runaways
 * Report a worker as missing (Internal Report)
 */
router.post('/', async (req, res, next) => {
    try {
        const schema = z.object({
            deploymentId: z.string().uuid(),
            missingDate: z.string().transform(str => new Date(str)),
            notes: z.string().optional(),
            threeDayCountdownStart: z.string().optional().transform(str => str ? new Date(str) : undefined)
        });

        const data = schema.parse(req.body);
        // TODO: Get userId from auth middleware when ready
        const record = await runawayService.createRecord({
            ...data,
            createdBy: undefined
        });
        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/runaways/:id/notification
 * Update Notification Info (Step 2)
 */
router.patch('/:id/notification', async (req, res, next) => {
    try {
        const schema = z.object({
            notificationDate: z.string().transform(str => new Date(str)),
            notificationNumber: z.string(),
            notes: z.string().optional()
        });
        const data = schema.parse(req.body);
        const record = await runawayService.updateNotification(req.params.id, data);
        res.json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/runaways/:id/confirm
 * Confirm Runaway (Step 3) - Freezes Quota
 */
router.post('/:id/confirm', async (req, res, next) => {
    try {
        const schema = z.object({
            notes: z.string().optional()
        });
        const data = schema.parse(req.body);
        const record = await runawayService.confirmRunaway(req.params.id, data.notes);
        res.json(record);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/runaways/:id/found
 * Mark as Found (Revoke)
 */
router.post('/:id/found', async (req, res, next) => {
    try {
        const record = await runawayService.markAsFound(req.params.id);
        res.json(record);
    } catch (error) {
        next(error);
    }
});

export default router;
