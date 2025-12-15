import cron from 'node-cron';
import prisma from '../prisma';
import type { WorkerTimeline, Deployment, Worker, Employer, Lead } from '@prisma/client';

// Batch processing configuration to prevent memory overload
const BATCH_SIZE = 100; // Process 100 records at a time

// Type for WorkerTimeline with nested relations
type TimelineWithRelations = WorkerTimeline & {
    deployment: Deployment & {
        worker: Worker;
        employer: Employer;
    };
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

    // Process WorkerTimeline in batches to prevent memory overload
    let cursor: string | undefined = undefined;
    let processedCount = 0;

    while (true) {
        // Fetch batch of timelines using cursor-based pagination
        const batch: TimelineWithRelations[] = await prisma.workerTimeline.findMany({
            take: BATCH_SIZE,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
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
                    }
                }
            },
            orderBy: { id: 'asc' }
        });

        if (batch.length === 0) break;

        // Optimize N+1 query: Fetch all service assignments for this batch in one query
        const workerIds = batch.map((tl: TimelineWithRelations) => tl.deployment.workerId);
        const assignments = await prisma.serviceAssignment.findMany({
            where: {
                workerId: { in: workerIds },
                role: 'service_staff',
                endDate: null
            }
        });

        // Create a lookup map for quick access
        const assignmentMap = new Map(
            assignments.map(a => [a.workerId, a.internalUserId])
        );

        // Cache admin user to avoid repeated queries
        let adminUserId: string | undefined;

        // Process each timeline in the batch
        for (const tl of batch) {
            const { deployment } = tl;
            const workerName = deployment.worker.englishName;

            // Find assignee from the map
            let targetUserId = assignmentMap.get(deployment.workerId);

            // Fallback to admin if no assignment
            if (!targetUserId) {
                if (!adminUserId) {
                    const admin = await prisma.internalUser.findFirst({ where: { role: 'admin' } });
                    adminUserId = admin?.id;
                }
                targetUserId = adminUserId;
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

        processedCount += batch.length;
        cursor = batch[batch.length - 1].id;

        console.log(`[Scheduler] Processed ${processedCount} worker timelines...`);
    }

    console.log(`[Scheduler] Completed processing ${processedCount} total worker timelines.`);

    // --- CRM Lead Follow-up Checks ---
    console.log('[Scheduler] Checking Lead Follow-ups...');
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Process Leads in batches to prevent memory overload
    let leadCursor: string | undefined = undefined;
    let processedLeads = 0;

    while (true) {
        const leadBatch: Lead[] = await prisma.lead.findMany({
            take: BATCH_SIZE,
            skip: leadCursor ? 1 : 0,
            cursor: leadCursor ? { id: leadCursor } : undefined,
            where: {
                nextFollowUpDate: {
                    lte: endOfDay, // Check for today or past due
                },
                status: { notIn: ['WON', 'LOST'] },
                assignedTo: { not: null }
            },
            orderBy: { id: 'asc' }
        });

        if (leadBatch.length === 0) break;

        for (const lead of leadBatch) {
            if (!lead.assignedTo) continue;

            // Check if we already notified today? 
            // Ideally we shouldn't spam. But for MVP we scan.
            // A smarter way is: check if there's a recent system comment for this?
            // Or just notify. Simplest is notify.

            await createNotification(
                lead.assignedTo,
                `Follow-up due for Lead: ${lead.companyName || lead.contactPerson} (Since ${lead.nextFollowUpDate?.toISOString().split('T')[0]})`,
                lead.id,
                'Lead'
            );
            console.log(`[Scheduler] Notified follow-up for Lead ${lead.id}`);
        }

        processedLeads += leadBatch.length;
        leadCursor = leadBatch[leadBatch.length - 1].id;

        console.log(`[Scheduler] Processed ${processedLeads} leads...`);
    }

    console.log(`[Scheduler] Completed processing ${processedLeads} total leads.`);
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
