import cron from 'node-cron';
import prisma from '../prisma';

/**
 * Creates a system notification (Comment + Mention)
 */
async function createNotification(
    targetUserId: string,
    content: string,
    refId: string,
    refTable: string
) {
    // 1. Find or Create System User (Bot)
    // For simplicity, we use the first admin or a specific 'system' user if it existed.
    // Here we'll just pick the first user to be the 'author' or null if we make author optional (but schema requires author).
    const systemUser = await prisma.internalUser.findFirst();
    if (!systemUser) return;

    // 2. Create Comment (System Alert)
    const comment = await prisma.systemComment.create({
        data: {
            content: `[System Alert] ${content}`,
            recordId: refId,
            recordTableName: refTable,
            createdBy: systemUser.id
        }
    });

    // 3. Create Mention
    await prisma.commentMention.create({
        data: {
            commentId: comment.id,
            mentionedUserId: targetUserId
        }
    });
}

/**
 * Run Daily Checks
 * Scans WorkerTimeline for upcoming expiries
 */
export async function runDailyChecks() {
    console.log('[Scheduler] Running daily checks...');

    const today = new Date();
    // Normalize to start of day
    today.setHours(0, 0, 0, 0);

    // Thresholds
    const checkPoints = [30, 60, 90];

    // Find active deployments with timelines
    const timelines = await prisma.workerTimeline.findMany({
        where: {
            deployment: {
                status: 'active'
            }
        },
        include: {
            deployment: {
                include: {
                    worker: true,
                    employer: true,
                    // We need to know WHO to notify. 
                    // For now, we'll notify all admins or associated service staff.
                    // Let's assume we notify the assigned 'service_staff' if exists, else first admin.
                }
            }
        }
    });

    // We need a helper to find the assigned user
    // Since we don't have direct relation in include easily without more query complexity,
    // we'll fetch assignments separately or optimize later.
    // Optimization: filtering in DB is better, but date math in Prisma/SQL directly can be tricky across DB types.
    // JS filter for MVP is acceptable for reasonable dataset.

    for (const tl of timelines) {
        const { deployment } = tl;
        const workerName = deployment.worker.englishName;

        // Find assignee (Service Staff)
        const assignment = await prisma.serviceAssignment.findFirst({
            where: {
                workerId: deployment.workerId,
                role: 'service_staff',
                endDate: null
            }
        });

        // Default target: The assignee, or finding an admin
        let targetUserId = assignment?.internalUserId;
        if (!targetUserId) {
            const admin = await prisma.internalUser.findFirst({ where: { role: 'admin' } });
            targetUserId = admin?.id;
        }
        if (!targetUserId) continue;


        // Helper to check and notify
        const checkDate = async (date: Date | null, label: string) => {
            if (!date) return;
            // Diff in days
            const diffTime = date.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (checkPoints.includes(diffDays)) {
                await createNotification(
                    targetUserId!,
                    `${workerName}'s ${label} expires in ${diffDays} days (${date.toISOString().split('T')[0]})`,
                    deployment.workerId,
                    'Worker'
                );
                console.log(`[Scheduler] Notified ${label} for ${workerName} (${diffDays} days)`);
            }
        };

        await checkDate(tl.residencePermitExpiry, 'ARC');
        await checkDate(tl.passportExpiry, 'Passport');
        await checkDate(tl.medCheck6moDeadline, '6-Mo Med Check');
        await checkDate(tl.medCheck18moDeadline, '18-Mo Med Check');
        await checkDate(tl.medCheck30moDeadline, '30-Mo Med Check');
    }
}

// Initialize Cron
export function initScheduler() {
    // Run every day at 00:00
    cron.schedule('0 0 * * *', () => {
        runDailyChecks();
    });

    // Run once on startup for dev/demo purposes (Optional, maybe confusing if it floods)
    // runDailyChecks();
    console.log('[Scheduler] Initialized 0 0 * * *');
}
