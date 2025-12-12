import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const users = await prisma.internalUser.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true
            },
            orderBy: { username: 'asc' }
        });
        res.json(users);
    } catch (error) {
        console.error('List Users Error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

export default router;
