import { Router } from 'express';
import { z } from 'zod';
import { jobOrderService } from '../services/jobOrderService';
import { interviewService } from '../services/interviewService';

const router = Router();

// ===== JOB ORDERS ===== //

const JobOrderSchema = z.object({
    employerId: z.string().uuid(),
    title: z.string().min(1, '職位名稱必填'),
    description: z.string().optional(),
    requiredCount: z.number().int().min(1).default(1),
    skillRequirements: z.string().optional(),
    workLocation: z.string().optional(),
    jobType: z.string().optional(),
    status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional().default('OPEN'),
});

// GET /api/job-orders
router.get('/job-orders', async (req, res) => {
    try {
        const { page, limit, status, employerId } = req.query;

        const result = await jobOrderService.searchJobOrders({
            page: page ? parseInt(page as string) : undefined,
            limit: limit ? parseInt(limit as string) : undefined,
            status: status as string,
            employerId: employerId as string,
        });

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: '查詢失敗', details: error.message });
    }
});

// POST /api/job-orders
router.post('/job-orders', async (req, res) => {
    try {
        const data = JobOrderSchema.parse(req.body);
        const jobOrder = await jobOrderService.createJobOrder(data as any);
        res.status(201).json(jobOrder);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: '資料驗證失敗', issues: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
});

// GET /api/job-orders/:id
router.get('/job-orders/:id', async (req, res) => {
    try {
        const jobOrder = await jobOrderService.getJobOrderById(req.params.id);
        if (!jobOrder) {
            return res.status(404).json({ error: '招募訂單不存在' });
        }
        res.json(jobOrder);
    } catch (error: any) {
        res.status(500).json({ error: '查詢失敗' });
    }
});

// PUT /api/job-orders/:id
router.put('/job-orders/:id', async (req, res) => {
    try {
        const updated = await jobOrderService.updateJobOrder(req.params.id, req.body);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: '更新失敗', details: error.message });
    }
});

// DELETE /api/job-orders/:id
router.delete('/job-orders/:id', async (req, res) => {
    try {
        await jobOrderService.deleteJobOrder(req.params.id);
        res.json({ message: '訂單已刪除' });
    } catch (error: any) {
        res.status(400).json({ error: '刪除失敗', details: error.message });
    }
});

// GET /api/job-orders/employer/:employerId/quota
router.get('/job-orders/employer/:employerId/quota', async (req, res) => {
    try {
        const quotaInfo = await jobOrderService.checkEmployerQuota(req.params.employerId);
        res.json(quotaInfo);
    } catch (error: any) {
        res.status(500).json({ error: '查詢失敗', details: error.message });
    }
});

// ===== INTERVIEWS ===== //

const InterviewSchema = z.object({
    candidateId: z.string().uuid(),
    employerId: z.string().uuid(),
    jobOrderId: z.string().uuid().optional(),
    interviewDate: z.string().transform(str => new Date(str)),
    result: z.enum(['PENDING', 'SELECTED', 'WAITLIST', 'REJECTED']).optional().default('PENDING'),
    notes: z.string().optional(),
    interviewerName: z.string().optional(),
});

// POST /api/interviews/check-duplicate
router.post('/interviews/check-duplicate', async (req, res) => {
    try {
        const { candidateId, employerId } = req.body;
        const result = await interviewService.checkDuplicateInterview(candidateId, employerId);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: '檢查失敗', details: error.message });
    }
});

// POST /api/interviews
router.post('/interviews', async (req, res) => {
    try {
        const data = InterviewSchema.parse(req.body);
        const interview = await interviewService.createInterview(data as any);
        res.status(201).json(interview);
    } catch (error: any) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: '資料驗證失敗', issues: error.issues });
        }
        res.status(400).json({ error: error.message });
    }
});

// PUT /api/interviews/:id
router.put('/interviews/:id', async (req, res) => {
    try {
        const updated = await interviewService.updateInterview(req.params.id, req.body);
        res.json(updated);
    } catch (error: any) {
        res.status(400).json({ error: '更新失敗', details: error.message });
    }
});

// GET /api/interviews/candidate/:candidateId
router.get('/interviews/candidate/:candidateId', async (req, res) => {
    try {
        const history = await interviewService.getInterviewHistory(req.params.candidateId);
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ error: '查詢失敗' });
    }
});

export default router;
