import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as industryJobTitleService from '../services/industryJobTitleService';

const router = Router();

const createSchema = z.object({
    industryId: z.string().uuid('請選擇有效的行業別'),
    titleZh: z.string().min(1, '職稱(中文)為必填').max(100),
    titleEn: z.string().max(100).optional().nullable(),
    titleTh: z.string().max(100).optional().nullable(),
    titleVn: z.string().max(100).optional().nullable(),
    titleId: z.string().max(100).optional().nullable(),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await industryJobTitleService.getIndustryJobTitles(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching industry job titles:', error);
        res.status(500).json({ error: 'Failed to fetch industry job titles' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const jobTitle = await industryJobTitleService.getIndustryJobTitleById(req.params.id);
        if (!jobTitle) {
            return res.status(404).json({ error: 'Industry job title not found' });
        }
        res.json(jobTitle);
    } catch (error) {
        console.error('Error fetching industry job title:', error);
        res.status(500).json({ error: 'Failed to fetch industry job title' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);

        // We need to shape the data for Prisma to connect the relation
        const createData: any = {
            ...validatedData,
            industry: {
                connect: { id: validatedData.industryId }
            }
        };
        // Remove industryId as it's handled by connect
        delete createData.industryId;

        const newJobTitle = await industryJobTitleService.createIndustryJobTitle(createData);
        res.status(201).json(newJobTitle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error creating industry job title:', error);
        res.status(500).json({ error: 'Failed to create industry job title' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);

        const updateData: any = { ...validatedData };
        if (validatedData.industryId) {
            updateData.industry = {
                connect: { id: validatedData.industryId }
            };
            delete updateData.industryId;
        }

        const updatedJobTitle = await industryJobTitleService.updateIndustryJobTitle(req.params.id, updateData);
        res.json(updatedJobTitle);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).errors });
        }
        console.error('Error updating industry job title:', error);
        res.status(500).json({ error: 'Failed to update industry job title' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await industryJobTitleService.deleteIndustryJobTitle(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting industry job title:', error);
        // Check for relation constraint errors if needed
        res.status(500).json({ error: 'Failed to delete industry job title' });
    }
});

export default router;
