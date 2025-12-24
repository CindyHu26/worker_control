
import express from 'express';
import { z } from 'zod';
import * as loanBankService from '../services/loanBankService';

const router = express.Router();

const loanBankSchema = z.object({
    code: z.string().min(1, '代碼為必填'),
    nameZh: z.string().min(1, '中文名稱為必填'),
    nameEn: z.string().optional(),
    sortOrder: z.coerce.number().int().default(0),
    isActive: z.boolean().default(true),
});

// GET /api/loan-banks
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await loanBankService.getLoanBanks(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '無法取得貸款銀行列表' });
    }
});

// GET /api/loan-banks/:id
router.get('/:id', async (req, res) => {
    try {
        const loanBank = await loanBankService.getLoanBankById(req.params.id);
        if (!loanBank) {
            return res.status(404).json({ error: '找不到貸款銀行' });
        }
        res.json(loanBank);
    } catch (error) {
        res.status(500).json({ error: '無法顯示貸款銀行' });
    }
});

// POST /api/loan-banks
router.post('/', async (req, res) => {
    try {
        const validated = loanBankSchema.parse(req.body);
        const newBank = await loanBankService.createLoanBank(validated);
        res.status(201).json(newBank);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '建立貸款銀行失敗' });
    }
});

// PATCH /api/loan-banks/:id
router.patch('/:id', async (req, res) => {
    try {
        const validated = loanBankSchema.partial().parse(req.body);
        const updatedBank = await loanBankService.updateLoanBank(req.params.id, validated);
        res.json(updatedBank);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '更新貸款銀行失敗' });
    }
});

// DELETE /api/loan-banks/:id
router.delete('/:id', async (req, res) => {
    try {
        await loanBankService.deleteLoanBank(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        res.status(500).json({ error: '刪除貸款銀行失敗' });
    }
});

export default router;
