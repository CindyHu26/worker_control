/**
 * Alerts API Routes - 異常儀表板 API
 * Phase 7.2: Smart Exception Dashboard
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as alertService from '../services/alertService';

const router = Router();

// Define enums locally until Prisma client is regenerated
const AlertSeverityEnum = z.enum(['CRITICAL', 'WARNING', 'INFO']);
const AlertStatusEnum = z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']);
const CommentEntityTypeEnum = z.enum(['WORKER', 'EMPLOYER', 'DEPLOYMENT', 'JOB_ORDER', 'LEAD']);

// Validation Schemas
const alertFilterSchema = z.object({
    severity: AlertSeverityEnum.optional(),
    status: AlertStatusEnum.optional(),
    entityType: CommentEntityTypeEnum.optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
});

/**
 * GET /api/alerts
 * 取得警示列表 (支援篩選 severity, status)
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const filters = alertFilterSchema.parse(req.query);
        const { alerts, total } = await alertService.getAlerts(filters);

        res.json({
            success: true,
            data: alerts,
            total,
            limit: filters.limit || 50,
            offset: filters.offset || 0,
        });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: '參數驗證失敗',
                details: error.issues,
            });
        } else {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : '取得警示失敗',
            });
        }
    }
});

/**
 * GET /api/alerts/summary
 * 取得警示統計 (各等級數量)
 */
router.get('/summary', async (_req: Request, res: Response) => {
    try {
        const summary = await alertService.getAlertSummary();

        res.json({
            success: true,
            data: summary,
        });
    } catch (error) {
        console.error('Error fetching alert summary:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得警示統計失敗',
        });
    }
});

/**
 * GET /api/alerts/:id
 * 取得單一警示
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const alert = await alertService.getAlertById(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: '警示不存在',
            });
        }

        res.json({
            success: true,
            data: alert,
        });
    } catch (error) {
        console.error('Error fetching alert:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得警示失敗',
        });
    }
});

/**
 * PATCH /api/alerts/:id/acknowledge
 * 確認警示
 */
router.patch('/:id/acknowledge', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // TODO: Get userId from authenticated user session
        const userId = req.body.userId || '00000000-0000-0000-0000-000000000000';

        const alert = await alertService.acknowledgeAlert(id, userId);

        res.json({
            success: true,
            message: '警示已確認',
            data: alert,
        });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '確認警示失敗',
        });
    }
});

/**
 * PATCH /api/alerts/:id/resolve
 * 解決警示
 */
router.patch('/:id/resolve', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const alert = await alertService.resolveAlert(id);

        res.json({
            success: true,
            message: '警示已解決',
            data: alert,
        });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '解決警示失敗',
        });
    }
});

/**
 * POST /api/alerts/generate
 * 手動觸發警示產生
 */
router.post('/generate', async (_req: Request, res: Response) => {
    try {
        const count = await alertService.generateAlerts();

        res.json({
            success: true,
            message: `已產生 ${count} 則新警示`,
            count,
        });
    } catch (error) {
        console.error('Error generating alerts:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '產生警示失敗',
        });
    }
});

/**
 * GET /api/alerts/entity/:entityType/:entityId
 * 依據實體取得警示
 */
router.get('/entity/:entityType/:entityId', async (req: Request, res: Response) => {
    try {
        const { entityType, entityId } = req.params;

        // Validate entityType
        const validatedEntityType = CommentEntityTypeEnum.parse(entityType.toUpperCase());

        const alerts = await alertService.getAlertsByEntity(validatedEntityType as alertService.CommentEntityType, entityId);

        res.json({
            success: true,
            data: alerts,
        });
    } catch (error) {
        console.error('Error fetching entity alerts:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : '取得實體警示失敗',
        });
    }
});

export default router;
