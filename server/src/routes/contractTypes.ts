
import express from 'express';
import { z } from 'zod';
import * as contractTypeService from '../services/contractTypeService';

const router = express.Router();

const contractTypeSchema = z.object({
    code: z.string().min(1, '代碼為必填'),
    name: z.string().min(1, '名稱為必填'),
    isControlled: z.boolean().default(false),
    description: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
});

// GET /api/contract-types
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await contractTypeService.getContractTypes(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '無法取得合約類別列表' });
    }
});

// GET /api/contract-types/:id
router.get('/:id', async (req, res) => {
    try {
        const item = await contractTypeService.getContractTypeById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: '找不到合約類別' });
        }
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: '無法顯示合約類別' });
    }
});

// POST /api/contract-types
router.post('/', async (req, res) => {
    try {
        const validated = contractTypeSchema.parse(req.body);
        const newItem = await contractTypeService.createContractType(validated);
        res.status(201).json(newItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '建立合約類別失敗' });
    }
});

// PATCH /api/contract-types/:id
router.patch('/:id', async (req, res) => {
    try {
        const validated = contractTypeSchema.partial().parse(req.body);
        const updatedItem = await contractTypeService.updateContractType(req.params.id, validated);
        res.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '更新合約類別失敗' });
    }
});

// DELETE /api/contract-types/:id
router.delete('/:id', async (req, res) => {
    try {
        await contractTypeService.deleteContractType(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        res.status(500).json({ error: '刪除合約類別失敗' });
    }
});

export default router;
