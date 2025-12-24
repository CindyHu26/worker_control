import { Router } from 'express';
import { z } from 'zod';
import { medicalExceptionService, DISEASE_TYPES, TREATMENT_STATUS } from '../services/medicalExceptionService';

const router = Router();

// 建立異常 Schema
const createExceptionSchema = z.object({
    workerId: z.string().uuid(),
    healthCheckId: z.string().uuid().optional().nullable(),
    diagnosisDate: z.string(),
    diseaseType: z.string(),
    description: z.string().optional().nullable(),
});

// 更新異常 Schema
const updateExceptionSchema = z.object({
    diseaseType: z.string().optional(),
    description: z.string().optional().nullable(),
    healthDeptNotified: z.boolean().optional(),
    employerNotified: z.boolean().optional(),
    treatmentStatus: z.enum(['PENDING', 'IN_TREATMENT', 'RECOVERED', 'DEPORTED']).optional(),
    resolutionDate: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
});

/**
 * GET /api/medical-exceptions
 * 列表 (分頁 + 篩選)
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;
        const diseaseType = req.query.diseaseType as string | undefined;
        const search = req.query.search as string | undefined;

        const result = await medicalExceptionService.listExceptions({
            page,
            limit,
            status,
            diseaseType,
            search,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching medical exceptions:', error);
        res.status(500).json({ error: error.message || '取得衛政通報列表失敗' });
    }
});

/**
 * GET /api/medical-exceptions/dashboard
 * 儀表板統計
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await medicalExceptionService.getDashboard();
        res.json(dashboard);
    } catch (error: any) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: error.message || '取得儀表板失敗' });
    }
});

/**
 * GET /api/medical-exceptions/disease-types
 * 疾病類型選項
 */
router.get('/disease-types', (req, res) => {
    res.json(DISEASE_TYPES);
});

/**
 * GET /api/medical-exceptions/:id
 * 取得單筆
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const exception = await medicalExceptionService.getExceptionById(id);

        if (!exception) {
            res.status(404).json({ error: '找不到該通報記錄' });
            return;
        }

        res.json(exception);
    } catch (error: any) {
        console.error('Error fetching medical exception:', error);
        res.status(500).json({ error: error.message || '取得衛政通報失敗' });
    }
});

/**
 * POST /api/medical-exceptions
 * 建立異常通報
 */
router.post('/', async (req, res) => {
    try {
        const validation = createExceptionSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: '資料驗證失敗',
                details: validation.error.issues,
            });
            return;
        }

        const data = validation.data;

        const result = await medicalExceptionService.createException({
            ...data,
            diagnosisDate: new Date(data.diagnosisDate),
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Error creating medical exception:', error);
        res.status(500).json({ error: error.message || '建立衛政通報失敗' });
    }
});

/**
 * PUT /api/medical-exceptions/:id
 * 更新異常通報
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const validation = updateExceptionSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: '資料驗證失敗',
                details: validation.error.issues,
            });
            return;
        }

        const data = validation.data;

        const result = await medicalExceptionService.updateException(id, {
            ...data,
            resolutionDate: data.resolutionDate ? new Date(data.resolutionDate) : undefined,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error updating medical exception:', error);
        res.status(500).json({ error: error.message || '更新衛政通報失敗' });
    }
});

/**
 * POST /api/medical-exceptions/:id/notify-health-dept
 * 標記衛生局已通報
 */
router.post('/:id/notify-health-dept', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await medicalExceptionService.markHealthDeptNotified(id);
        res.json(result);
    } catch (error: any) {
        console.error('Error marking health dept notified:', error);
        res.status(500).json({ error: error.message || '標記衛生局通報失敗' });
    }
});

/**
 * POST /api/medical-exceptions/:id/notify-employer
 * 標記雇主已通知
 */
router.post('/:id/notify-employer', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await medicalExceptionService.markEmployerNotified(id);
        res.json(result);
    } catch (error: any) {
        console.error('Error marking employer notified:', error);
        res.status(500).json({ error: error.message || '標記雇主通知失敗' });
    }
});

export default router;
