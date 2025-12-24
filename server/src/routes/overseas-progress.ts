import { Router } from 'express';
import { z } from 'zod';
import { overseasProgressService } from '../services/overseasProgressService';

const router = Router();

// 進度更新 Schema
const progressUpdateSchema = z.object({
    // 海外體檢
    medicalExamDate: z.string().optional().nullable(),
    medicalExamResult: z.enum(['PASS', 'FAIL', 'PENDING']).optional().nullable(),
    medicalExamRemarks: z.string().optional().nullable(),
    // 良民證
    policeClrDate: z.string().optional().nullable(),
    policeClrStatus: z.enum(['ISSUED', 'PENDING', 'REJECTED']).optional().nullable(),
    policeClrRemarks: z.string().optional().nullable(),
    // 護照
    passportChecked: z.boolean().optional(),
    passportExpiryOk: z.boolean().optional(),
    passportRemarks: z.string().optional().nullable(),
    // 舊居留證
    arcChecked: z.boolean().optional(),
    arcHasIssues: z.boolean().optional(),
    arcRemarks: z.string().optional().nullable(),
});

/**
 * GET /api/overseas-progress
 * 列表 (分頁 + 搜尋 + 狀態篩選)
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const status = req.query.status as string | undefined;
        const search = req.query.search as string | undefined;

        const result = await overseasProgressService.listAllProgress({
            page,
            limit,
            status,
            search,
        });

        res.json(result);
    } catch (error: any) {
        console.error('Error fetching overseas progress list:', error);
        res.status(500).json({ error: error.message || '取得海外進度列表失敗' });
    }
});

/**
 * GET /api/overseas-progress/:candidateId
 * 取得單筆進度
 */
router.get('/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        const progress = await overseasProgressService.getProgressByCandidateId(candidateId);

        if (!progress) {
            // 如果沒有記錄，回傳空的初始資料
            res.json({
                candidateId,
                medicalExamDate: null,
                medicalExamResult: null,
                policeClrDate: null,
                policeClrStatus: null,
                passportChecked: false,
                passportExpiryOk: false,
                arcChecked: false,
                arcHasIssues: false,
                overallStatus: 'IN_PROGRESS',
            });
            return;
        }

        res.json(progress);
    } catch (error: any) {
        console.error('Error fetching overseas progress:', error);
        res.status(500).json({ error: error.message || '取得海外進度失敗' });
    }
});

/**
 * PUT /api/overseas-progress/:candidateId
 * 更新進度
 */
router.put('/:candidateId', async (req, res) => {
    try {
        const { candidateId } = req.params;
        const validation = progressUpdateSchema.safeParse(req.body);

        if (!validation.success) {
            res.status(400).json({
                error: '資料驗證失敗',
                details: validation.error.issues,
            });
            return;
        }

        const data = validation.data;

        // 轉換日期字串
        const progressData = {
            ...data,
            medicalExamDate: data.medicalExamDate ? new Date(data.medicalExamDate) : null,
            policeClrDate: data.policeClrDate ? new Date(data.policeClrDate) : null,
        };

        const result = await overseasProgressService.upsertProgress(candidateId, progressData);
        res.json(result);
    } catch (error: any) {
        console.error('Error updating overseas progress:', error);
        res.status(500).json({ error: error.message || '更新海外進度失敗' });
    }
});

/**
 * GET /api/overseas-progress/:candidateId/report
 * 產生進度報告 (雇主回報用)
 */
router.get('/:candidateId/report', async (req, res) => {
    try {
        const { candidateId } = req.params;
        const report = await overseasProgressService.generateProgressReport(candidateId);
        res.json(report);
    } catch (error: any) {
        console.error('Error generating progress report:', error);
        res.status(500).json({ error: error.message || '產生進度報告失敗' });
    }
});

export default router;
