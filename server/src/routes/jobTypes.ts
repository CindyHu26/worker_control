import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as jobTypeService from '../services/jobTypeService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, '代碼為必填').max(20),
    titleZh: z.string().min(1, '中文工種名稱為必填').max(100),
    titleEn: z.string().min(1, '英文工種名稱為必填').max(100),
    titleTh: z.string().max(100).optional(),
    titleId: z.string().max(100).optional(),
    titleVn: z.string().max(100).optional(),
    employmentSecurityFee: z.number().int().default(0),
    reentrySecurityFee: z.number().int().default(0),
    agencyAccidentInsurance: z.boolean().default(false),
    agencyAccidentInsuranceAmt: z.number().int().default(0),
    agencyLaborHealthInsurance: z.boolean().default(false),
    collectBankLoan: z.boolean().default(false),
    payDay: z.number().int().min(1).max(31).optional().nullable(),
    requiresMedicalCheckup: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await jobTypeService.getJobTypes(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching job types:', error);
        res.status(500).json({ error: 'Failed to fetch job types' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const jobType = await jobTypeService.getJobTypeById(req.params.id);
        if (!jobType) {
            return res.status(404).json({ error: 'Job type not found' });
        }
        res.json(jobType);
    } catch (error) {
        console.error('Error fetching job type:', error);
        res.status(500).json({ error: 'Failed to fetch job type' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);
        const newJobType = await jobTypeService.createJobType(validatedData);
        res.status(201).json(newJobType);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error creating job type:', error);
        res.status(500).json({ error: 'Failed to create job type' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);
        const updatedJobType = await jobTypeService.updateJobType(req.params.id, validatedData);
        res.json(updatedJobType);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error updating job type:', error);
        res.status(500).json({ error: 'Failed to update job type' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await jobTypeService.deleteJobType(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting job type:', error);
        res.status(500).json({ error: 'Failed to delete job type' });
    }
});

export default router;
