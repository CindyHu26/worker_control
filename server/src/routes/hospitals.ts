
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/hospitals
// Query params:
// - type: 'general' | 'xray' (optional, if omitted returns all)
// - city: string (optional filter)
// - search: string (optional search by name)
router.get('/', async (req, res) => {
    try {
        const { type, city, search } = req.query;

        const whereClause: any = { isDeleted: false };

        if (type === 'general') {
            whereClause.isGeneral = true;
        } else if (type === 'xray') {
            whereClause.isXray = true;
        } else if (type === 'overseas') {
            whereClause.isOverseas = true;
        }

        if (city) {
            whereClause.city = { contains: String(city) };
        }

        if (search) {
            whereClause.name = { contains: String(search) };
        }

        const hospitals = await prisma.hospital.findMany({
            where: whereClause,
            orderBy: {
                city: 'asc' // Sort by city then name usually good
            }
        });

        res.json(hospitals);
    } catch (error) {
        console.error('List Hospitals Error:', error);
        res.status(500).json({ error: 'Failed to fetch hospitals' });
    }
});

export default router;
