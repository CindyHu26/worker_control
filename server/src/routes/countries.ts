
import express from 'express';
import { z } from 'zod';
import * as countryService from '../services/countryService';

const router = express.Router();

const countrySchema = z.object({
    code: z.string().min(1, '代碼為必填').max(10, '代碼最多10字元'),
    nameZh: z.string().min(1, '中文名稱為必填').max(50, '名稱最多50字元'),
    nameEn: z.string().max(50, '英文名稱最多50字元').optional().nullable(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
});

// GET /api/countries
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await countryService.getCountries(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '無法取得國別列表' });
    }
});

// GET /api/countries/:id
router.get('/:id', async (req, res) => {
    try {
        const item = await countryService.getCountryById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: '找不到國別資料' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: '無法顯示國別資料' });
    }
});

// POST /api/countries
router.post('/', async (req, res) => {
    try {
        const validated = countrySchema.parse(req.body);
        const newItem = await countryService.createCountry(validated);
        res.status(201).json(newItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '建立國別失敗' });
    }
});

// PATCH /api/countries/:id
router.patch('/:id', async (req, res) => {
    try {
        const validated = countrySchema.partial().parse(req.body);
        const updatedItem = await countryService.updateCountry(req.params.id, validated);
        res.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '更新國別失敗' });
    }
});

// DELETE /api/countries/:id
router.delete('/:id', async (req, res) => {
    try {
        await countryService.deleteCountry(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        res.status(500).json({ error: '刪除國別失敗' });
    }
});

export default router;
