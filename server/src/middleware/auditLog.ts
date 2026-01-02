/**
 * Audit Logging Middleware
 * Tracks critical operations for security and compliance
 */

import { Request, Response, NextFunction } from 'express';
import { AuditAction } from '@prisma/client';
import { createAuditLog } from '../services/auditLogService';
import logger from '../utils/logger';

/**
 * Extract user ID from request (assuming auth middleware sets req.user)
 */
function getUserId(req: Request): string | undefined {
    return (req as any).user?.id || (req as any).userId;
}

/**
 * Extract entity ID from request params or response body
 */
function extractEntityId(req: Request, body: any): string | undefined {
    // Try from params first
    if (req.params?.id) {
        return req.params.id;
    }

    // Try from response body
    if (body?.id) {
        return body.id;
    }

    if (body?.data?.id) {
        return body.data.id;
    }

    return undefined;
}

/**
 * Extract IP address from request
 */
function getIpAddress(req: Request): string | undefined {
    return req.ip ||
        req.headers['x-forwarded-for'] as string ||
        req.headers['x-real-ip'] as string ||
        req.socket.remoteAddress;
}

/**
 * Audit Log Middleware
 * Automatically logs CRUD operations to database
 * 
 * @param action - The audit action (CREATE, READ, UPDATE, DELETE)
 * @param entityType - The entity type being operated on (e.g., "worker", "employer")
 */
export function auditLogMiddleware(action: AuditAction, entityType: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Capture original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Only log if operation was successful (2xx status code)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = getUserId(req);

                // Skip if no user ID (e.g., public endpoints)
                if (userId) {
                    const entityId = extractEntityId(req, body);

                    // Log asynchronously (don't wait for it)
                    createAuditLog({
                        userId,
                        action,
                        entityType,
                        entityId,
                        requestPath: req.path,
                        requestMethod: req.method,
                        ipAddress: getIpAddress(req),
                        userAgent: req.get('user-agent'),
                        changes: action === 'UPDATE' ? req.body : undefined,
                        metadata: {
                            query: req.query,
                            statusCode: res.statusCode,
                        },
                    }).catch(err => {
                        logger.error('Audit log failed:', err);
                    });
                }
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Helper to manually log an audit entry
 * Use this for complex operations that need custom audit logic
 */
export async function logAuditEntry(data: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    changes?: any;
    metadata?: any;
    req?: Request;
}) {
    try {
        await createAuditLog({
            userId: data.userId,
            action: data.action,
            entityType: data.entityType,
            entityId: data.entityId,
            changes: data.changes,
            requestPath: data.req?.path || '/unknown',
            requestMethod: data.req?.method || 'UNKNOWN',
            ipAddress: data.req ? getIpAddress(data.req) : undefined,
            userAgent: data.req?.get('user-agent'),
            metadata: data.metadata,
        });
    } catch (error) {
        logger.error('Manual audit log failed:', error);
    }
}

export default auditLogMiddleware;
