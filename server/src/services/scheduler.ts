import cron from 'node-cron';
import prisma from '../prisma';
import type { Deployment, Worker, Employer } from '@prisma/client';

// Batch processing configuration to prevent memory overload
const BATCH_SIZE = 100; // Process 100 records at a time

// Type for Deployment with nested relations
type DeploymentWithRelations = Deployment & {
    worker: Worker;
    employer: Employer;
};

/**
 * Creates a system notification (Comment + Mention)
 */
export async function createNotification(
    targetUserId: string,
    content: string,
    refId: string,
    refTable: string
) {
    // 1. Find or Create System User (Bot)
    const systemUser = await prisma.internalUser.findFirst({
        where: { role: 'admin' }
    });
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
 * Scans Active Deployments (and Workers) for upcoming expiries
 */
export async function runDailyChecks() {
    console.log('[Scheduler] Running daily checks...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkPoints = [30, 60, 90];

    let cursor: string | undefined = undefined;
    let processedCount = 0;

    while (true) {
        const batch: DeploymentWithRelations[] = await prisma.deployment.findMany({
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            where: {
                status: 'active'
            },
            include: {
                worker: true,
                employer: true,
            },
            orderBy: { id: 'asc' }
        });

        if (batch.length === 0) break;

        const workerIds = batch.map((d) => d.workerId);
        const assignments = await prisma.serviceAssignment.findMany({
            where: {
                workerId: { in: workerIds },
                endDate: null // Active assignments
            }
        });

        const assignmentMap = new Map(
            assignments.map(a => [a.workerId, a.internalUserId])
        );

        let adminUserId: string | undefined;

        for (const deployment of batch) {
            const { worker } = deployment;
            const workerName = worker.englishName;

            let targetUserId = assignmentMap.get(deployment.workerId);

            if (!targetUserId) {
                if (!adminUserId) {
                    const admin = await prisma.internalUser.findFirst({
                        where: { role: 'admin' }
                    });
                    adminUserId = admin?.id;
                }
                targetUserId = adminUserId;
            }

            if (!targetUserId) continue;

            const accountId = targetUserId;

            const checkDate = async (date: Date | null, label: string) => {
                if (!date) return;
                const dateObj = new Date(date);
                dateObj.setHours(0, 0, 0, 0);
                const diffTime = dateObj.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (checkPoints.includes(diffDays)) {
                    await createNotification(
                        accountId,
                        `${workerName}'s ${label} expires in ${diffDays} days (${dateObj.toISOString().split('T')[0]})`,
                        deployment.workerId,
                        'Worker'
                    );
                    console.log(`[Scheduler] Notified ${label} for ${workerName} (${diffDays} days)`);
                }
            };

            await checkDate(worker.residencePermitExpiry, 'ARC');
            await checkDate(worker.passportExpiry, 'Passport');
            await checkDate(worker.medCheck6moDeadline, '6-Mo Med Check');
            await checkDate(worker.medCheck18moDeadline, '18-Mo Med Check');
            await checkDate(worker.medCheck30moDeadline, '30-Mo Med Check');
        }

        processedCount += batch.length;
        cursor = batch[batch.length - 1].id;
        console.log(`[Scheduler] Processed ${processedCount} deployments...`);
    }

    // CRM Lead checks removed for now as Lead model is missing in schema
    console.log(`[Scheduler] Completed processing ${processedCount} deployments.`);
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
