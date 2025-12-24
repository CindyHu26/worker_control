import { Router } from 'express';
import {
    getBanks,
    getBankById,
    createBank,
    updateBank,
    deleteBank
} from '../services/bankService';

const router = Router();

// GET /api/banks
router.get('/', async (req, res, next) => {
    try {
        const result = await getBanks(req.query as any);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/banks/:id
router.get('/:id', async (req, res, next) => {
    try {
        const result = await getBankById(req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /api/banks
router.post('/', async (req, res, next) => {
    try {
        const result = await createBank(req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// PUT /api/banks/:id
router.put('/:id', async (req, res, next) => {
    try {
        const result = await updateBank(req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/banks/:id
router.delete('/:id', async (req, res, next) => {
    try {
        await deleteBank(req.params.id);
        res.json({ success: true, message: 'Bank deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
