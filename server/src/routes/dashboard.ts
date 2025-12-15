import { Router } from 'express';
import prisma from '../prisma';
import { getTaiwanToday, getTaiwanMonthStart, getTaiwanNow } from '../utils/dateUtils';
import { toZonedTime } from 'date-fns-tz';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        const now = getTaiwanToday();
        const taiwanNow = toZonedTime(now, 'Asia/Taipei');
        const startOfMonth = getTaiwanMonthStart(taiwanNow.getFullYear(), taiwanNow.getMonth() + 1);
        const currentMonth = taiwanNow.getMonth() + 1; // 1-12

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

        // Birthday count using SQL date functions (SQLite compatible)
        // Count workers with birthdays this month who have active deployments
        const birthdaysThisMonth = await prisma.$queryRaw<[{ count: number }]>`
            SELECT COUNT(*) as count
            FROM workers w
            WHERE CAST(strftime('%m', w.dob) AS INTEGER) = ${currentMonth}
            AND EXISTS (
                SELECT 1 FROM deployments d 
                WHERE d.worker_id = w.id 
                AND d.status = 'active'
            )
        `;

        // Active recruitment: RecruitmentLetters with remaining quota
        // Use raw SQL since Prisma doesn't support field-to-field comparison
        const activeRecruitmentResult = await prisma.$queryRaw<[{ count: number }]>`
            SELECT COUNT(*) as count
            FROM recruitment_letters
            WHERE expiry_date >= ${now.toISOString()}
            AND used_quota < approved_quota
        `;

        // Pending documents: Count active document templates
        // (You can adjust this logic based on your actual requirements)
        const pendingDocuments = await prisma.documentTemplate.count({
            where: {
                isActive: true
            }
        });

        res.json({
            totalActiveWorkers,
            newEntriesThisMonth,
            birthdaysThisMonth: Number(birthdaysThisMonth[0].count),
            activeRecruitment: Number(activeRecruitmentResult[0].count),
            pendingDocuments
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
        const taiwanNow = toZonedTime(now, 'Asia/Taipei');
        const currentMonth = taiwanNow.getMonth() + 1; // 1-12

        // Use raw SQL for efficient month extraction and joining
        const birthdays = await prisma.$queryRaw<Array<{
            id: string;
            englishName: string;
            chineseName: string | null;
            dob: string;
            companyName: string;
        }>>`
            SELECT 
                w.id,
                w.english_name as englishName,
                w.chinese_name as chineseName,
                w.dob,
                e.company_name as companyName
            FROM workers w
            INNER JOIN deployments d ON d.worker_id = w.id
            INNER JOIN employers e ON e.id = d.employer_id
            WHERE CAST(strftime('%m', w.dob) AS INTEGER) = ${currentMonth}
            AND d.status = 'active'
            ORDER BY CAST(strftime('%d', w.dob) AS INTEGER) ASC
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
