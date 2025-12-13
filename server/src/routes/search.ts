
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/search?q=keyword
router.get('/', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string' || q.length < 2) {
            return res.json([]);
        }

        const keyword = q.trim();

        // Parallel search across models
        const [workers, employers] = await Promise.all([
            // Search Workers
            prisma.worker.findMany({
                where: {
                    OR: [
                        { englishName: { contains: keyword } },
                        { chineseName: { contains: keyword } },
                        {
                            passports: {
                                some: { passportNumber: { contains: keyword } }
                            }
                        },
                        {
                            arcs: {
                                some: { arcNumber: { contains: keyword } }
                            }
                        }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    englishName: true,
                    chineseName: true,
                    passports: {
                        where: { isCurrent: true },
                        select: { passportNumber: true },
                        take: 1
                    }
                }
            }),

            // Search Employers
            prisma.employer.findMany({
                where: {
                    OR: [
                        { companyName: { contains: keyword } },
                        { taxId: { contains: keyword } },
                        { responsiblePerson: { contains: keyword } }
                    ]
                },
                take: 5,
                select: {
                    id: true,
                    companyName: true,
                    taxId: true,
                    responsiblePerson: true
                }
            })
        ]);

        // Transform to unified format
        const results = [
            ...workers.map(w => ({
                id: w.id,
                type: 'worker',
                title: w.chineseName || w.englishName,
                subtitle: `Worker • ${w.englishName} • ${w.passports[0]?.passportNumber || 'No Passport'}`,
                url: `/workers/${w.id}`
            })),
            ...employers.map(e => ({
                id: e.id,
                type: 'employer',
                title: e.companyName,
                subtitle: `Employer • Tax ID: ${e.taxId} • ${e.responsiblePerson || '-'}`,
                url: `/employers/${e.id}`
            }))
        ];

        res.json(results);
    } catch (error) {
        console.error('Global Search Error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
