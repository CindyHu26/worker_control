/**
 * Audit Log API Routes
 * Provides endpoints for querying audit trail data
 */

import { Router } from 'express';
import { AuditAction } from '@prisma/client';
import {
    getUserActivityLog,
    getEntityAuditLog,
    trackPageView,
    getUserPageViewStats,
    getRecentAuditLogs,
} from '../services/auditLogService';

const router = Router();

/**
 * GET /api/audit-logs
 * Query audit logs with filters
 */
router.get('/', async (req, res) => {
    try {
        const {
            userId,
            action,
            entityType,
            startDate,
            endDate,
            limit,
            offset,
        } = req.query;

        // If no userId provided, get recent logs (admin only)
        if (!userId) {
            const logs = await getRecentAuditLogs(
                limit ? parseInt(limit as string) : 100
            );
            return res.json(logs);
        }

        const logs = await getUserActivityLog(userId as string, {
            action: action as AuditAction,
            entityType: entityType as string,
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
            limit: limit ? parseInt(limit as string) : 50,
            offset: offset ? parseInt(offset as string) : 0,
        });

        res.json(logs);
    } catch (error: any) {
        console.error('Audit logs query error:', error);
        res.status(500).json({ error: error.message || 'Failed to query audit logs' });
    }
});

/**
 * GET /api/audit-logs/entity/:entityType/:entityId
 * Get all operations performed on a specific entity
 */
router.get('/entity/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const logs = await getEntityAuditLog(entityType, entityId);

        res.json(logs);
    } catch (error: any) {
        console.error('Entity audit log error:', error);
        res.status(500).json({ error: error.message || 'Failed to get entity audit log' });
    }
});

/**
 * GET /api/audit-logs/page-views/:userId
 * Get page view statistics for a user
 */
router.get('/page-views/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const stats = await getUserPageViewStats(userId, {
            startDate: startDate ? new Date(startDate as string) : undefined,
            endDate: endDate ? new Date(endDate as string) : undefined,
        });

        res.json(stats);
    } catch (error: any) {
        console.error('Page view stats error:', error);
        res.status(500).json({ error: error.message || 'Failed to get page view stats' });
    }
});

/**
 * POST /api/audit-logs/page-view
 * Track a page view from frontend
 */
router.post('/page-view', async (req, res) => {
    try {
        const { path, duration, metadata } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        await trackPageView({
            userId,
            path,
            duration,
            metadata,
        });

        res.status(201).json({ success: true });
    } catch (error: any) {
        console.error('Page view tracking error:', error);
        res.status(500).json({ error: error.message || 'Failed to track page view' });
    }
});

export default router;
