import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const accounts = await prisma.internalUser.findMany({
            orderBy: { username: 'asc' }
        });
        res.json(accounts);
    } catch (error) {
        console.error('List Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
