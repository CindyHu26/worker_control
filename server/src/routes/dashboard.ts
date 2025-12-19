import { Router } from 'express';
import prisma from '../prisma';
import { getTaiwanToday, getTaiwanMonthStart } from '../utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const now = getTaiwanToday();
        const startOfMonth = getTaiwanMonthStart(now.getFullYear(), now.getMonth() + 1);

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

        // Birthday count using Postgres SQL
        const currentMonth = now.getMonth() + 1;
        const birthdaysResult = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM workers w
            WHERE EXTRACT(MONTH FROM w.dob) = ${currentMonth}
            AND EXISTS (
                SELECT 1 FROM deployments d 
                WHERE d.worker_id = w.id 
                AND d.status = 'active'
            )
        `;

        const activeRecruitmentResult = await prisma.$queryRaw<[{ count: bigint }]>`
            SELECT COUNT(*) as count
            FROM employer_recruitment_letters
            WHERE expiry_date >= ${now}
            AND used_quota < approved_quota
        `;

        res.json({
            totalActiveWorkers,
            newEntriesThisMonth,
            birthdaysThisMonth: Number(birthdaysResult[0].count),
            activeRecruitment: Number(activeRecruitmentResult[0].count),
            pendingDocuments: 0
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/dashboard/birthdays
router.get('/birthdays', async (req, res) => {
    try {
        const now = getTaiwanToday();
        const currentMonth = now.getMonth() + 1;

        const birthdays = await prisma.$queryRaw<Array<{
            id: string;
            englishName: string;
            chineseName: string | null;
            dob: Date;
            companyName: string;
        }>>`
            SELECT 
                w.id,
                w.english_name as "englishName",
                w.chinese_name as "chineseName",
                w.dob,
                e.company_name as "companyName"
            FROM workers w
            INNER JOIN deployments d ON d.worker_id = w.id
            INNER JOIN employers e ON e.id = d.employer_id
            WHERE EXTRACT(MONTH FROM w.dob) = ${currentMonth}
            AND d.status = 'active'
            ORDER BY EXTRACT(DAY FROM w.dob) ASC
            LIMIT 50
        `;

        res.json(birthdays);
    } catch (error) {
        console.error('Birthdays Error:', error);
        res.status(500).json({ error: 'Failed to fetch birthdays' });
    }
});


// GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
    try {
        const today = getTaiwanToday();
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // 1. Fetch upcoming from WorkerTimeline
        const timelines = await prisma.workerTimeline.findMany({
            where: {
                OR: [
                    { medCheck6moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { medCheck18moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { medCheck30moDeadline: { lte: thirtyDaysFromNow, gte: today } },
                    { residencePermitExpiry: { lte: thirtyDaysFromNow, gte: today } },
                    { passportExpiry: { lte: thirtyDaysFromNow, gte: today } }
                ],
                deployment: { status: 'active' }
            },
            include: {
                deployment: {
                    include: {
                        worker: true,
                        employer: true
                    }
                }
            },
            take: 50
        });

        // 2. Fetch upcoming from direct HealthChecks
        const healthChecks = await prisma.healthCheck.findMany({
            where: {
                checkDate: { lte: thirtyDaysFromNow, gte: today },
                result: 'pending'
            },
            include: {
                worker: true,
                deployment: {
                    include: { employer: true }
                }
            },
            take: 50
        });

        const alerts: any[] = [];

        // Map timelines
        timelines.forEach(t => {
            const dueDates = [
                { type: 'MedCheck 6mo', date: t.medCheck6moDeadline },
                { type: 'MedCheck 18mo', date: t.medCheck18moDeadline },
                { type: 'MedCheck 30mo', date: t.medCheck30moDeadline },
                { type: 'ARC Expiry', date: t.residencePermitExpiry },
                { type: 'Passport Expiry', date: t.passportExpiry },
            ];
            const urgent = dueDates.find(d => d.date && d.date <= thirtyDaysFromNow && d.date >= today);
            if (urgent && urgent.date) {
                const diffTime = new Date(urgent.date).getTime() - today.getTime();
                alerts.push({
                    id: t.id,
                    workerName: t.deployment.worker.chineseName || t.deployment.worker.englishName,
                    companyName: t.deployment.employer.companyName,
                    alertType: urgent.type,
                    dueDate: urgent.date,
                    daysRemaining: Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                });
            }
        });

        // Map health checks
        healthChecks.forEach(hc => {
            const diffTime = new Date(hc.checkDate).getTime() - today.getTime();
            alerts.push({
                id: hc.id,
                workerName: hc.worker.chineseName || hc.worker.englishName,
                companyName: hc.deployment.employer.companyName,
                alertType: `Health Check (${hc.checkType})`,
                dueDate: hc.checkDate,
                daysRemaining: Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            });
        });

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
