import prisma from '../prisma';

export const quotaService = {
    /**
     * Checks if a recruitment letter has available quota based on its policy (Circular vs One-time).
     * Throws an error if quota is exceeded.
     * This function does NOT update the usedQuota cache; it only validates.
     * @param letterId 
     * @param workerGender 'male' | 'female' | 'other'
     * @param tx Prisma Transaction Client
     */
    async checkQuotaAvailability(letterId: string, workerGender: string | null | undefined, tx: any) {
        // enforce transaction context
        if (!tx) throw new Error('Transaction context required for quota check');

        // LOCK the letter row to prevent race conditions
        // This ensures no other transaction can read/update this letter until this one finishes
        await tx.$executeRawUnsafe(
            `SELECT 1 FROM "employer_recruitment_letters" WHERE id = $1 FOR UPDATE`,
            letterId
        );

        const letter = await tx.employerRecruitmentLetter.findUnique({
            where: { id: letterId }
        });

        if (!letter) {
            throw new Error('Recruitment Letter not found');
        }

        const isCircular = letter.canCirculate;

        // If circular, we only count currently occupying slots (active/pending).
        // If not circular, we count ALL deployments ever made with this letter.
        const statusFilter = isCircular
            ? { in: ['active', 'pending'] }
            : undefined; // undefined means all statuses

        const currentUsage = await tx.deployment.count({
            where: {
                recruitmentLetterId: letterId,
                status: statusFilter
            }
        });

        if (currentUsage >= letter.approvedQuota) {
            throw new Error(`入國通知人數已滿 (Quota Exceeded) - Approved: ${letter.approvedQuota}, Used: ${currentUsage}`);
        }

        // Gender Specific Check
        if (letter.quotaMale > 0 || letter.quotaFemale > 0) {
            // Note: Prisma Enum for Gender is lowercase 'male'/'female'
            if (workerGender === 'male' && letter.quotaMale > 0) {
                const maleUsage = await tx.deployment.count({
                    where: {
                        recruitmentLetterId: letterId,
                        status: statusFilter,
                        worker: { gender: 'male' }
                    }
                });
                if (maleUsage >= letter.quotaMale) {
                    throw new Error('男性名額已滿 (Male Quota Exceeded)');
                }
            } else if (workerGender === 'female' && letter.quotaFemale > 0) {
                const femaleUsage = await tx.deployment.count({
                    where: {
                        recruitmentLetterId: letterId,
                        status: statusFilter,
                        worker: { gender: 'female' }
                    }
                });
                if (femaleUsage >= letter.quotaFemale) {
                    throw new Error('女性名額已滿 (Female Quota Exceeded)');
                }
            }
        }
    },

    /**
     * Recalculates and updates the 'usedQuota' cache field for a recruitment letter.
     * Should be called after any operation that changes deployments (create, status change, delete).
     * @param letterId 
     * @param tx 
     */
    async recalculateUsage(letterId: string, tx: any) {
        const db = tx || prisma;

        const letter = await db.employerRecruitmentLetter.findUnique({
            where: { id: letterId }
        });
        if (!letter) return;

        const isCircular = letter.canCirculate;
        const statusFilter = isCircular
            ? { in: ['active', 'pending'] }
            : undefined;

        const count = await db.deployment.count({
            where: {
                recruitmentLetterId: letterId,
                status: statusFilter
            }
        });

        await db.employerRecruitmentLetter.update({
            where: { id: letterId },
            data: { usedQuota: count }
        });
    }
};
