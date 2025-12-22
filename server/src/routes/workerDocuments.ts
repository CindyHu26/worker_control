import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { differenceInDays, addYears } from 'date-fns';

const router = Router();

// --- 1. Passport Management ---

const PassportRenewalSchema = z.object({
    workerId: z.string().uuid(),
    newPassportNumber: z.string().min(1),
    issueDate: z.string().transform(str => new Date(str)),
    expiryDate: z.string().transform(str => new Date(str)),
    issuePlace: z.string().optional(),
});

// Renew Passport (Archive old, Create new)
router.post('/passport/renew', async (req, res) => {
    try {
        const data = PassportRenewalSchema.parse(req.body);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Mark all existing passports for this worker as NOT current
            await tx.workerPassport.updateMany({
                where: { workerId: data.workerId },
                data: { isCurrent: false }
            });

            // 2. Create new passport as current
            const newPassport = await tx.workerPassport.create({
                data: {
                    workerId: data.workerId,
                    passportNumber: data.newPassportNumber,
                    issueDate: data.issueDate,
                    expiryDate: data.expiryDate,
                    issuePlace: data.issuePlace,
                    isCurrent: true
                }
            });
            return newPassport;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: 'Failed to renew passport' });
    }
});

// --- 2. 12/14 Years Limit Calculation ---

// Calculate cumulative time in Taiwan based on Deployments
// Rules:
// - Count days between entryDate (or startDate) and endDate (or now if active)
// - Exclude runaway periods? (Usually yes, but simplified here: just count Active/Ended deployments)

router.get('/:workerId/year-limit', async (req, res) => {
    const { workerId } = req.params;
    try {
        const deployments = await prisma.deployment.findMany({
            where: {
                workerId,
                status: { in: ['active', 'ended', 'terminated'] }
            },
            select: {
                startDate: true,
                endDate: true,
                entryDate: true,
                status: true,
                serviceStatus: true
            }
        });

        let totalDays = 0;
        const now = new Date();

        deployments.forEach(d => {
            // Priority: entryDate -> startDate
            const start = d.entryDate || d.startDate;
            let end = d.endDate;

            // If active and no end date, use NOW
            if (d.status === 'active' && !end) {
                end = now;
            }

            // Valid range?
            if (start && end && end > start) {
                // Exclude if Runaway? (Policy dependent, usually runaway time doesn't count for legal max stay, but technically they are here)
                // Let's assume we count it for "Physical Presence" but might need adjustments for "Legal Work Limit".
                // User asked for "Cumulative in Taiwan days".

                totalDays += differenceInDays(end, start);
            }
        });

        const years = Math.floor(totalDays / 365);
        const remainingDays = totalDays % 365;

        // Alarm Thresholds (12 years = 4380 days, 14 years = 5110 days)
        const years12 = 12 * 365;
        const years14 = 14 * 365;

        const isApproaching12 = totalDays >= (years12 - 120); // 4 months warning
        const isApproaching14 = totalDays >= (years14 - 120);

        res.json({
            totalDays,
            formatted: `${years} Years, ${remainingDays} Days`,
            isApproachingLimit: isApproaching12 || isApproaching14,
            limitType: isApproaching14 ? '14 Years' : '12 Years'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to calculate limits' });
    }
});

export default router;
