import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as workTitleService from '../services/workTitleService';

const router = Router();

const createSchema = z.object({
    categoryId: z.string().uuid().optional(),
    code: z.string().min(1, 'Code is required').max(20),
    titleZh: z.string().min(1, 'Chinese title is required').max(100),
    titleEn: z.string().max(100).default(''),
    titleTh: z.string().optional(),
    titleId: z.string().optional(),
    titleVn: z.string().optional(),
    isIntermediate: z.boolean().default(false),
    isDefault: z.boolean().default(false),
    employmentSecurityFee: z.number().int().default(2000),
    reentrySecurityFee: z.number().int().default(2000),
    agencyAccidentInsurance: z.boolean().default(false),
    agencyAccidentInsuranceAmt: z.number().int().default(0),
    agencyLaborHealthInsurance: z.boolean().default(false),
    collectBankLoan: z.boolean().default(false),
    payDay: z.number().int().optional(),
    requiresMedicalCheckup: z.boolean().default(false),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

// GET /api/work-titles
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 100;
        const search = req.query.search as string;
        const categoryId = req.query.categoryId as string;

        const result = await workTitleService.getWorkTitles(page, pageSize, search, categoryId);
        res.json(result);
    } catch (error) {
        console.error('Error fetching work titles:', error);
        res.status(500).json({ error: 'Failed to fetch work titles' });
    }
});

// GET /api/work-titles/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const workTitle = await workTitleService.getWorkTitleById(req.params.id);
        if (!workTitle) {
            return res.status(404).json({ error: 'Work title not found' });
        }
        res.json(workTitle);
    } catch (error) {
        console.error('Error fetching work title:', error);
        res.status(500).json({ error: 'Failed to fetch work title' });
    }
});

// POST /api/work-titles
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);
        const newWorkTitle = await workTitleService.createWorkTitle(validatedData as any);
        res.status(201).json(newWorkTitle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error creating work title:', error);
        res.status(500).json({ error: 'Failed to create work title' });
    }
});

// PUT /api/work-titles/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);
        const updatedWorkTitle = await workTitleService.updateWorkTitle(req.params.id, validatedData as any);
        res.json(updatedWorkTitle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error updating work title:', error);
        res.status(500).json({ error: 'Failed to update work title' });
    }
});

// DELETE /api/work-titles/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await workTitleService.deleteWorkTitle(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting work title:', error);
        res.status(500).json({ error: 'Failed to delete work title' });
    }
});

export default router;
