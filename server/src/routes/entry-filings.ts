import { Router } from 'express';
import { z } from 'zod';
import { entryFilingService } from '../services/entryFilingService';

const router = Router();

// 更新 Schema
const filingUpdateSchema = z.object({
    entryDate: z.string(),
    flightNo: z.string().optional().nullable(),
    visaNo: z.string().optional().nullable(),
    // 入國通報
    entryReportDate: z.string().optional().nullable(),
    entryReportRefNo: z.string().optional().nullable(),
    // 入境健檢
    initialExamDate: z.string().optional().nullable(),
    initialExamHospital: z.string().optional().nullable(),
    initialExamResult: z.enum(['PASS', 'FAIL', 'PENDING']).optional().nullable(),
    // 居留證
    arcApplyDate: z.string().optional().nullable(),
    arcReceiptNo: z.string().optional().nullable(),
    arcNo: z.string().optional().nullable(),
    // 聘僱許可
    permitApplyDate: z.string().optional().nullable(),
    permitReceiptNo: z.string().optional().nullable(),
    permitNo: z.string().optional().nullable(),
});

/**
 * GET /api/entry-filings
 * 列表 (分頁 + 篩選)
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;
        const search = req.query.search as string | undefined;

        const result = await entryFilingService.listFilings({
            page,
            limit,
            status,
            search,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching entry filings:', error);
        res.status(500).json({ error: error.message || '取得入境申報列表失敗' });
    }
});

/**
 * GET /api/entry-filings/dashboard
 * 合規儀表板統計
 */
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await entryFilingService.getComplianceDashboard();
        res.json(dashboard);
    } catch (error: any) {
        console.error('Error fetching dashboard:', error);
        res.status(500).json({ error: error.message || '取得儀表板失敗' });
    }
});

/**
 * GET /api/entry-filings/:workerId
 * 取得單筆入境申報
 */
router.get('/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;
        const filing = await entryFilingService.getFilingByWorkerId(workerId);

        if (!filing) {
            res.json({
                workerId,
                entryDate: null,
                overallCompliance: 'PENDING',
            });
            return;
        }

        res.json(filing);
    } catch (error: any) {
        console.error('Error fetching entry filing:', error);
        res.status(500).json({ error: error.message || '取得入境申報失敗' });
    }
});

/**
 * PUT /api/entry-filings/:workerId
 * 更新入境申報
 */
router.put('/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;
        const validation = filingUpdateSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: '資料驗證失敗',
                details: validation.error.issues,
            });
            return;
        }

        const data = validation.data;

        // 轉換日期字串
        const filingData = {
            ...data,
            entryDate: new Date(data.entryDate),
            entryReportDate: data.entryReportDate ? new Date(data.entryReportDate) : null,
            initialExamDate: data.initialExamDate ? new Date(data.initialExamDate) : null,
            arcApplyDate: data.arcApplyDate ? new Date(data.arcApplyDate) : null,
            permitApplyDate: data.permitApplyDate ? new Date(data.permitApplyDate) : null,
        };

        const result = await entryFilingService.upsertFiling(workerId, filingData);
        res.json(result);
    } catch (error: any) {
        console.error('Error updating entry filing:', error);
        res.status(500).json({ error: error.message || '更新入境申報失敗' });
    }
});

export default router;
