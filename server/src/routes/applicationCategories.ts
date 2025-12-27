import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as applicationCategoryService from '../services/applicationCategoryService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, 'Code is required').max(30),
    nameZh: z.string().min(1, 'Chinese name is required').max(100),
    nameEn: z.string().optional(),
    type: z.enum(['BUSINESS', 'INDIVIDUAL', 'INSTITUTION']).default('BUSINESS'),
    quotaBaseRate: z.number().optional(),
    securityFeeStandard: z.number().int().default(2000),
    iconName: z.string().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

// GET /api/application-categories
router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 100;
        const search = req.query.search as string;

        const result = await applicationCategoryService.getApplicationCategories(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching application categories:', error);
        res.status(500).json({ error: 'Failed to fetch application categories' });
    }
});

// GET /api/application-categories/by-code/:code
router.get('/by-code/:code', async (req: Request, res: Response) => {
    try {
        const category = await applicationCategoryService.getApplicationCategoryByCode(req.params.code);
        if (!category) {
            return res.status(404).json({ error: 'Application category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error fetching application category:', error);
        res.status(500).json({ error: 'Failed to fetch application category' });
    }
});

// GET /api/application-categories/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const category = await applicationCategoryService.getApplicationCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Application category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error fetching application category:', error);
        res.status(500).json({ error: 'Failed to fetch application category' });
    }
});

// POST /api/application-categories
router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);
        const newCategory = await applicationCategoryService.createApplicationCategory(validatedData as any);
        res.status(201).json(newCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error creating application category:', error);
        res.status(500).json({ error: 'Failed to create application category' });
    }
});

// PUT /api/application-categories/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);
        const updatedCategory = await applicationCategoryService.updateApplicationCategory(req.params.id, validatedData as any);
        res.json(updatedCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error updating application category:', error);
        res.status(500).json({ error: 'Failed to update application category' });
    }
});

// DELETE /api/application-categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await applicationCategoryService.deleteApplicationCategory(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting application category:', error);
        res.status(500).json({ error: 'Failed to delete application category' });
    }
});

export default router;
