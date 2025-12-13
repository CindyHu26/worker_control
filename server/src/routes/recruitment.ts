
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/recruitment/letters?employerId=...
router.get('/letters', async (req, res) => {
    try {
        const { employerId } = req.query;
        if (!employerId) return res.status(400).json({ error: 'Employer ID required' });

        const letters = await prisma.recruitmentLetter.findMany({
            where: { employerId: String(employerId) },
            include: {
                entryPermits: {
                    include: {
                        _count: { select: { deployments: true } }
                    }
                }
            },
            orderBy: { issueDate: 'desc' }
        });

        // Calculate usedQuota for letters based on permits? 
        // Or simply trust the `entryPermits` list. 
        // The prompt says "RecruitmentLetter.usedQuota should be the sum of quotas of all its EntryPermits."
        // We can do this calculation on read or rely on a stored field if we maintain it.
        // Let's rely on summing permits for "total allocated" and deployments for "total used".

        const result = letters.map(l => {
            const totalPermitQuota = l.entryPermits.reduce((sum, p) => sum + p.quota, 0);
            return {
                ...l,
                calculatedUsedQuota: totalPermitQuota // This is how much of the LETTER is used by Permits
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch letters' });
    }
});

// POST /api/recruitment/letters
router.post('/letters', async (req, res) => {
    try {
        const { employerId, letterNumber, issueDate, expiryDate, approvedQuota } = req.body;

        const letter = await prisma.recruitmentLetter.create({
            data: {
                employerId,
                letterNumber,
                issueDate: new Date(issueDate),
                expiryDate: new Date(expiryDate),
                approvedQuota: Number(approvedQuota)
            }
        });
        res.json(letter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create letter' });
    }
});

// POST /api/recruitment/letters/:id/permits
router.post('/letters/:id/permits', async (req, res) => {
    const { id } = req.params;
    const { permitNumber, issueDate, expiryDate, quota } = req.body;
    const quotaNum = Number(quota);

    try {
        await prisma.$transaction(async (tx) => {
            const letter = await tx.recruitmentLetter.findUnique({
                where: { id },
                include: { entryPermits: true }
            });
            if (!letter) throw new Error('Letter not found');

            // Check Quota
            const currentUsed = letter.entryPermits.reduce((sum, p) => sum + p.quota, 0);
            if (currentUsed + quotaNum > letter.approvedQuota) {
                throw new Error(`Quota exceeded. Remaining: ${letter.approvedQuota - currentUsed}`);
            }

            const permit = await tx.entryPermit.create({
                data: {
                    recruitmentLetterId: id,
                    permitNumber,
                    issueDate: new Date(issueDate),
                    expiryDate: new Date(expiryDate),
                    quota: quotaNum
                }
            });

            // Update letter usedQuota field if we use it, otherwise the calculation on read is enough.
            // But let's keep the DB field in sync for easier query performance if needed later.
            await tx.recruitmentLetter.update({
                where: { id },
                data: { usedQuota: { increment: quotaNum } }
            });

            return permit;
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

export default router;
