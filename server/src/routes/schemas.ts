
import { Router } from 'express';
import { workerFormSchema } from '../config/workerSchema';

const router = Router();

// GET /api/schemas/worker
router.get('/worker', (req, res) => {
    try {
        // In the future, we could fetch this from the DB (SystemFields table)
        // For now, we serve the static config
        res.json({
            fields: workerFormSchema,
            version: '1.0.0'
        });
    } catch (error) {
        console.error('Schema Error:', error);
        res.status(500).json({ error: 'Failed to fetch schema' });
    }
});

export default router;
