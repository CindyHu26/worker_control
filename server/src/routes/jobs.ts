import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// POST /api/jobs/update-tax-residency
router.post('/update-tax-residency', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const today = new Date();
        const endOfCalculation = today; // We count days up to today

        // Find workers who are currently NOT tax residents
        const workers = await prisma.worker.findMany({
            where: { isTaxResident: false },
            include: {
                deployments: true // Need history to sum days
            }
        });

        let updatedCount = 0;
        const updates = [];

        // We need a system user for comments. Lets try to find one or use a placeholder if schema allows (it doesn't, FK required).
        // For prototype, pick the first user.
        const systemUser = await prisma.internalUser.findFirst();

        for (const worker of workers) {
            let totalDaysInYear = 0;

            for (const d of worker.deployments) {
                // Determine stay period for this deployment
                const stayStart = d.entryDate ? new Date(d.entryDate) : new Date(d.startDate);
                let stayEnd = d.endDate ? new Date(d.endDate) : today;

                // If the stay ended after today (future?), cap at today for "proven" stay
                if (stayEnd > today) stayEnd = today;

                // Calculate Overlap with Current Year
                // Overlap Start = Max(StayStart, Jan 1)
                const overlapStart = stayStart > startOfYear ? stayStart : startOfYear;

                // Overlap End = Min(StayEnd, Today) - already capped stayEnd at today
                const overlapEnd = stayEnd; // stayEnd is <= today.

                // If overlapStart > overlapEnd, no overlap in this year (or deployment ended before year start)
                if (overlapStart > overlapEnd) continue;

                const oneDay = 1000 * 60 * 60 * 24;
                const days = Math.floor((overlapEnd.getTime() - overlapStart.getTime()) / oneDay) + 1;

                if (days > 0) totalDaysInYear += days;
            }

            if (totalDaysInYear >= 183) {
                // Update Worker
                const updatePromise = prisma.$transaction(async (tx) => {
                    await tx.worker.update({
                        where: { id: worker.id },
                        data: { isTaxResident: true }
                    });

                    if (systemUser) {
                        await tx.systemComment.create({
                            data: {
                                recordId: worker.id,
                                recordTableName: 'workers',
                                content: `System Auto-Update: Tax Residency Status set to TRUE. (Stayed ${totalDaysInYear} days in ${currentYear})`,
                                createdBy: systemUser.id
                            }
                        });
                    }
                });
                updates.push(updatePromise);
                updatedCount++;
            }
        }

        await Promise.all(updates);

        res.json({
            message: `Tax residency update job completed.`,
            scannedWorkers: workers.length,
            updatedWorkers: updatedCount
        });

    } catch (error: any) {
        console.error('Update Tax Residency Error:', error);
        res.status(500).json({ error: 'Job failed: ' + error.message });
    }
});

export default router;
