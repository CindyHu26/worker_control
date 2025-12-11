import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const totalActiveWorkers = await prisma.deployment.count({
            where: {
                status: 'active',
                serviceStatus: 'active_service'
            }
        });

        const newEntriesThisMonth = await prisma.deployment.count({
            where: {
                entryDate: {
                    gte: startOfMonth
                }
            }
        });

        res.json({
            totalActiveWorkers,
            newEntriesThisMonth
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30); // Exactly 30 days later

        // Fetch timelines where any key date is soon
        // This is a bit complex in Prisma to do "OR" across multiple fields with relations efficiently
        // We will fetch where AT LEAST ONE matches

        const timelines = await prisma.workerTimeline.findMany({
            where: {
                OR: [
                    { medCheck6moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { medCheck18moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { medCheck30moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { residencePermitExpiry: { lte: thirtyDaysFromNow, gte: today } },
                    { passportExpiry: { lte: thirtyDaysFromNow, gte: today } }
                ],
                deployment: {
                    status: 'active' // Only active deployments
                }
            },
            include: {
                deployment: {
                    include: {
                        worker: {
                            select: {
                                id: true,
                                englishName: true,
                                chineseName: true,
                                nationality: true
                            }
                        },
                        employer: {
                            select: {
                                companyName: true
                            }
                        }
                    }
                }
            },
            take: 50 // Limit for dashboard
        });

        // Transform into a flat "Alert" structure for frontend
        const alerts = timelines.map(t => {
            const dueDates = [
                { type: 'MedCheck 6mo', date: t.medCheck6moDeadline },
                { type: 'MedCheck 18mo', date: t.medCheck18moDeadline },
                { type: 'MedCheck 30mo', date: t.medCheck30moDeadline },
                { type: 'ARC Expiry', date: t.residencePermitExpiry },
                { type: 'Passport Expiry', date: t.passportExpiry },
            ];

            // Find the specific one triggering the alert (first one found)
            const urgentOne = dueDates.find(d => d.date && d.date <= thirtyDaysFromNow && d.date >= today); // Re-check strictly

            // Calculate days remaining consistently
            let daysRemaining = 0;
            if (urgentOne?.date) {
                const diffTime = new Date(urgentOne.date).getTime() - today.getTime();
                daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            return {
                id: t.id,
                workerName: t.deployment.worker.chineseName || t.deployment.worker.englishName,
                companyName: t.deployment.employer.companyName,
                alertType: urgentOne?.type || 'Generic Deadline',
                dueDate: urgentOne?.date,
                daysRemaining: daysRemaining
            };
        }).filter(a => a.dueDate); // double check

        res.json(alerts);
    } catch (error) {
        console.error('Alerts Error:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// GET /api/dashboard/incidents
router.get('/incidents', async (req, res) => {
    try {
        const incidents = await prisma.incident.findMany({
            where: {
                status: 'open',
                severityLevel: {
                    in: ['high', 'critical']
                }
            },
            include: {
                worker: {
                    select: {
                        id: true,
                        englishName: true,
                        chineseName: true
                    }
                },
                employer: {
                    select: {
                        id: true,
                        companyName: true
                    }
                }
            },
            orderBy: {
                incidentDate: 'desc'
            },
            take: 10
        });

        res.json(incidents);
    } catch (error) {
        console.error('Incidents Error:', error);
        res.status(500).json({ error: 'Failed to fetch incidents' });
    }
});

export default router;
