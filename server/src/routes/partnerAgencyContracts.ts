
import express from 'express';
import { z } from 'zod';
import * as contractService from '../services/partnerAgencyContractService';

const router = express.Router();

const contractSchema = z.object({
    agencyId: z.string().uuid('必須選擇國外仲介'),
    contractNo: z.string().min(1, '合約編號為必填'),
    contractType: z.string().optional(),

    // Date strings from frontend YYYY-MM-DD
    signedDate: z.string().optional().or(z.literal('')),
    validFrom: z.string().optional().or(z.literal('')),
    validTo: z.string().optional().or(z.literal('')),

    summary: z.string().optional(),
    documentPath: z.string().optional(),
    status: z.string().default('ACTIVE'), // ACTIVE, EXPIRED, TERMINATED
});

// Helper to parse date string to Date object
const parseDate = (dateStr?: string | null) => {
    if (!dateStr) return undefined;
    return new Date(dateStr);
};

// GET /api/partner-agency-contracts
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await contractService.getContracts(page, limit, search);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: '無法取得合約列表' });
    }
});

// GET /api/partner-agency-contracts/:id
router.get('/:id', async (req, res) => {
    try {
        const contract = await contractService.getContractById(req.params.id);
        if (!contract) {
            return res.status(404).json({ error: '找不到合約' });
        }
        res.json(contract);
    } catch (error) {
        res.status(500).json({ error: '無法顯示合約' });
    }
});

// POST /api/partner-agency-contracts
router.post('/', async (req, res) => {
    try {
        const validated = contractSchema.parse(req.body);

        // Transform dates
        const data = {
            ...validated,
            signedDate: parseDate(validated.signedDate),
            validFrom: parseDate(validated.validFrom),
            validTo: parseDate(validated.validTo),
        };

        const newContract = await contractService.createContract(data);
        res.status(201).json(newContract);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '建立合約失敗' });
    }
});

// PATCH /api/partner-agency-contracts/:id
router.patch('/:id', async (req, res) => {
    try {
        const validated = contractSchema.partial().parse(req.body);

        // Transform dates if present
        const data: any = { ...validated };
        if (validated.signedDate !== undefined) data.signedDate = parseDate(validated.signedDate);
        if (validated.validFrom !== undefined) data.validFrom = parseDate(validated.validFrom);
        if (validated.validTo !== undefined) data.validTo = parseDate(validated.validTo);

        const updated = await contractService.updateContract(req.params.id, data);
        res.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as z.ZodError).errors });
        }
        res.status(500).json({ error: '更新合約失敗' });
    }
});

// DELETE /api/partner-agency-contracts/:id
router.delete('/:id', async (req, res) => {
    try {
        await contractService.deleteContract(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        res.status(500).json({ error: '刪除合約失敗' });
    }
});

export default router;
