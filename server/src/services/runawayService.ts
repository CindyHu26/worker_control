import { PrismaClient, RunawayRecord, RunawayStatus } from '@prisma/client';
import prisma from '../prisma';
import { ResourceNotFoundError, ValidationError } from '../types/errors';
import { quotaService } from './quotaService';

export const runawayService = {
    /**
     * List runaway records with optional filtering
     */
    async listRecords(filters: {
        status?: RunawayStatus;
        employerId?: string;
        search?: string;
    }) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.employerId) where.deployment = { employerId: filters.employerId };
        if (filters.search) {
            where.OR = [
                { deployment: { worker: { nameZh: { contains: filters.search } } } },
                { deployment: { worker: { nameEn: { contains: filters.search, mode: 'insensitive' } } } },
                { deployment: { employer: { name: { contains: filters.search } } } },
            ];
        }

        return prisma.runawayRecord.findMany({
            where,
            include: {
                deployment: {
                    include: {
                        worker: true,
                        employer: true
                    }
                }
            },
            orderBy: { reportDate: 'desc' }
        });
    },

    /**
     * Get a single record by ID
     */
    async getRecord(id: string) {
        const record = await prisma.runawayRecord.findUnique({
            where: { id },
            include: {
                deployment: {
                    include: {
                        worker: true,
                        employer: true
                    }
                }
            }
        });
        if (!record) throw new ResourceNotFoundError('RunawayRecord', id);
        return record;
    },

    /**
     * Create a new runaway record (Start tracking)
     * This is "Internal Report"
     */
    async createRecord(data: {
        deploymentId: string;
        missingDate: Date;
        notes?: string;
        createdBy?: string;
        threeDayCountdownStart?: Date;
    }) {
        return prisma.$transaction(async (tx) => {
            // 1. Verify Deployment
            const deployment = await tx.deployment.findUnique({
                where: { id: data.deploymentId }
            });
            if (!deployment) throw new ResourceNotFoundError('Deployment', data.deploymentId);

            // 2. Create Record
            const record = await tx.runawayRecord.create({
                data: {
                    deploymentId: data.deploymentId,
                    missingDate: data.missingDate,
                    notes: data.notes,
                    createdBy: data.createdBy,
                    status: RunawayStatus.reported_internally,
                    threeDayCountdownStart: data.threeDayCountdownStart || data.missingDate,
                    // Initially quota is NOT frozen until confirmed logic?
                    // Or strictly, if missing, we just track.
                    isQuotaFrozen: false
                }
            });

            // We do NOT change deployment status yet.

            return record;
        });
    },

    /**
     * Update Notification Info (Step 2)
     */
    async updateNotification(id: string, data: {
        notificationDate: Date;
        notificationNumber: string;
        notes?: string;
    }) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.runawayRecord.update({
                where: { id },
                data: {
                    notificationDate: data.notificationDate,
                    notificationNumber: data.notificationNumber,
                    status: RunawayStatus.notification_submitted,
                    notes: data.notes
                        ? { set: data.notes } // Or append?
                        : undefined
                }
            });
            return record;
        });
    },

    /**
     * Confirm Runaway (Step 3) - Freezes Quota
     */
    async confirmRunaway(id: string, notes?: string) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.runawayRecord.findUnique({ where: { id } });
            if (!record) throw new ResourceNotFoundError('RunawayRecord', id);

            const updatedRecord = await tx.runawayRecord.update({
                where: { id },
                data: {
                    status: RunawayStatus.confirmed_runaway,
                    isQuotaFrozen: true,
                    notes: notes ? notes : undefined
                }
            });

            // Update Deployment Status to Terminated/Runaway
            // Assuming 'terminated' in DeploymentStatus and 'runaway' in ServiceStatus
            await tx.deployment.update({
                where: { id: record.deploymentId },
                data: {
                    status: 'terminated',
                    serviceStatus: 'runaway',
                    endDate: record.missingDate // End date is missing date?
                }
            });

            // Recalculate Quota for the recruitment letter
            const deployment = await tx.deployment.findUnique({ where: { id: record.deploymentId } });
            if (deployment?.recruitmentLetterId) {
                await quotaService.recalculateUsage(deployment.recruitmentLetterId, tx);
            }

            return updatedRecord;
        });
    },

    /**
     * Mark as Found (Revoke)
     */
    async markAsFound(id: string) {
        return prisma.$transaction(async (tx) => {
            const record = await tx.runawayRecord.findUnique({ where: { id } });
            if (!record) throw new ResourceNotFoundError('RunawayRecord', id);

            const updatedRecord = await tx.runawayRecord.update({
                where: { id },
                data: {
                    status: RunawayStatus.found,
                    isQuotaFrozen: false
                }
            });

            // If found, what happens to Deployment?
            // Maybe set back to active? User needs to decide.
            // Ideally human intervention required.
            // We just unfreeze quota.

            // Recalculate Quota
            const deployment = await tx.deployment.findUnique({ where: { id: record.deploymentId } });
            if (deployment?.recruitmentLetterId) {
                await quotaService.recalculateUsage(deployment.recruitmentLetterId, tx);
            }

            return updatedRecord;
        });
    }
};
