import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as employerCategoryService from '../services/employerCategoryService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, 'Code is required').max(20),
    nameZh: z.string().min(1, 'Chinese name is required').max(50),
    nameEn: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await employerCategoryService.getEmployerCategories(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching employer categories:', error);
        res.status(500).json({ error: 'Failed to fetch employer categories' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const category = await employerCategoryService.getEmployerCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Employer category not found' });
        }
        res.json(category);
    } catch (error) {
        console.error('Error fetching employer category:', error);
        res.status(500).json({ error: 'Failed to fetch employer category' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);
        const newCategory = await employerCategoryService.createEmployerCategory(validatedData);
        res.status(201).json(newCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error creating employer category:', error);
        res.status(500).json({ error: 'Failed to create employer category' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);
        const updatedCategory = await employerCategoryService.updateEmployerCategory(req.params.id, validatedData);
        res.json(updatedCategory);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error updating employer category:', error);
        res.status(500).json({ error: 'Failed to update employer category' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await employerCategoryService.deleteEmployerCategory(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting employer category:', error);
        res.status(500).json({ error: 'Failed to delete employer category' });
    }
});

export default router;
