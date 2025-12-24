import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as industryService from '../services/industryService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, '行業代碼為必填').max(10),
    category: z.string().max(5).optional().nullable(),
    nameZh: z.string().min(1, '中文名稱為必填').max(100),
    nameEn: z.string().max(100).optional().nullable(),
    nameTh: z.string().max(100).optional().nullable(),
    nameVn: z.string().max(100).optional().nullable(),
    nameId: z.string().max(100).optional().nullable(),
    isOpen: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await industryService.getIndustries(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching industries:', error);
        res.status(500).json({ error: 'Failed to fetch industries' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const industry = await industryService.getIndustryById(req.params.id);
        if (!industry) {
            return res.status(404).json({ error: 'Industry not found' });
        }
        res.json(industry);
    } catch (error) {
        console.error('Error fetching industry:', error);
        res.status(500).json({ error: 'Failed to fetch industry' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);
        const newIndustry = await industryService.createIndustry(validatedData);
        res.status(201).json(newIndustry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error creating industry:', error);
        res.status(500).json({ error: 'Failed to create industry' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);
        const updatedIndustry = await industryService.updateIndustry(req.params.id, validatedData);
        res.json(updatedIndustry);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error updating industry:', error);
        res.status(500).json({ error: 'Failed to update industry' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await industryService.deleteIndustry(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting industry:', error);
        res.status(500).json({ error: 'Failed to delete industry' });
    }
});

export default router;
