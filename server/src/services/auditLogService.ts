/**
 * Audit Log Service
 * Centralized service for creating and querying audit logs
 */

import prisma from '../prisma';
import { AuditAction } from '@prisma/client';

interface CreateAuditLogData {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    changes?: any;
    requestPath: string;
    requestMethod: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
}

interface PageViewData {
    userId: string;
    path: string;
    duration?: number;
    metadata?: any;
}

interface ActivityLogOptions {
    limit?: number;
    offset?: number;
    action?: AuditAction;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: CreateAuditLogData) {
    try {
        return await prisma.auditLog.create({
            data: {
                userId: data.userId,
                action: data.action,
                entityType: data.entityType,
                entityId: data.entityId,
                changes: data.changes,
                requestPath: data.requestPath,
                requestMethod: data.requestMethod,
                ipAddress: data.ipAddress,
                userAgent: data.userAgent,
                metadata: data.metadata,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the application
        return null;
    }
}

/**
 * Track a page view
 */
export async function trackPageView(data: PageViewData) {
    return await createAuditLog({
        userId: data.userId,
        action: 'PAGE_VIEW',
        entityType: 'page',
        requestPath: data.path,
        requestMethod: 'GET',
        pageViewDuration: data.duration,
        metadata: data.metadata,
    });
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(userId: string, options?: ActivityLogOptions) {
    const where: any = { userId };

    if (options?.action) {
        where.action = options.action;
    }

    if (options?.entityType) {
        where.entityType = options.entityType;
    }

    if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) {
            where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
            where.createdAt.lte = options.endDate;
        }
    }

    return await prisma.auditLog.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
    });
}

/**
 * Get all operations on a specific entity
 */
export async function getEntityAuditLog(entityType: string, entityId: string) {
    return await prisma.auditLog.findMany({
        where: {
            entityType,
            entityId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Get page view analytics for a user
 */
export async function getUserPageViewStats(userId: string, options?: {
    startDate?: Date;
    endDate?: Date;
}) {
    const where: any = {
        userId,
        action: 'PAGE_VIEW',
    };

    if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) {
            where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
            where.createdAt.lte = options.endDate;
        }
    }

    const pageViews = await prisma.auditLog.findMany({
        where,
        select: {
            requestPath: true,
            pageViewDuration: true,
            createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    // Group by path and calculate stats
    const pathStats: Record<string, {
        visits: number;
        totalDuration: number;
        avgDuration: number;
        lastVisit: Date;
    }> = {};

    pageViews.forEach((view) => {
        const path = view.requestPath;
        if (!pathStats[path]) {
            pathStats[path] = {
                visits: 0,
                totalDuration: 0,
                avgDuration: 0,
                lastVisit: view.createdAt,
            };
        }

        pathStats[path].visits++;
        pathStats[path].totalDuration += view.pageViewDuration || 0;
        pathStats[path].avgDuration = pathStats[path].totalDuration / pathStats[path].visits;

        if (view.createdAt > pathStats[path].lastVisit) {
            pathStats[path].lastVisit = view.createdAt;
        }
    });

    return pathStats;
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit: number = 100) {
    return await prisma.auditLog.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    name: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}
