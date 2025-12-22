/**
 * Audit Logging Middleware
 * Tracks critical operations for security and compliance
 */

import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { auditLog } from '../utils/logger';

/**
 * Operations that should be audit logged
 */
const AUDITED_OPERATIONS = {
    // Employer operations
    'POST /api/employers': 'CREATE_EMPLOYER',
    'PUT /api/employers/:id': 'UPDATE_EMPLOYER',
    'DELETE /api/employers/:id': 'DELETE_EMPLOYER',

    // Worker operations
    'POST /api/workers': 'CREATE_WORKER',
    'DELETE /api/workers/:id': 'DELETE_WORKER',

    // Deployment operations
    'POST /api/deployments': 'CREATE_DEPLOYMENT',
    'PATCH /api/deployments/:id': 'TERMINATE_DEPLOYMENT',

    // Recruitment letter operations
    'POST /api/recruitment-letters': 'CREATE_RECRUITMENT_LETTER',
    'DELETE /api/recruitment-letters/:id': 'DELETE_RECRUITMENT_LETTER',
};

/**
 * Extract user ID from request (assuming auth middleware sets req.user)
 */
function getUserId(req: Request): string | undefined {
    return (req as any).user?.id || (req as any).userId;
}

/**
 * Create operation key from request
 */
function getOperationKey(req: Request): string {
    return `${req.method} ${req.route?.path || req.path}`;
}

/**
 * Audit Log Middleware
 * Call this AFTER successful operation but BEFORE sending response
 */
export function auditLogMiddleware(operation: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Capture original res.json to intercept response
        const originalJson = res.json.bind(res);

        res.json = function (body: any) {
            // Only log if operation was successful (2xx status code)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = getUserId(req);

                auditLog(operation, userId, {
                    method: req.method,
                    path: req.path,
                    params: req.params,
                    resourceId: body?.data?.id || body?.id,
                    timestamp: new Date().toISOString(),
                });
            }

            return originalJson(body);
        };

        next();
    };
}

/**
 * Create audit log entry in database
 * For compliance requirements that need persistent audit trails
 */
export async function createAuditLogEntry(data: {
    operation: string;
    userId?: string;
    resourceType: string;
    resourceId?: string;
    changes?: any;
    metadata?: any;
}) {
    // TODO: Create AuditLog model in Prisma schema first
    // await prisma.auditLog.create({
    //   data: {
    //     operation: data.operation,
    //     userId: data.userId,
    //     resourceType: data.resourceType,
    //     resourceId: data.resourceId,
    //     changes: data.changes,
    //     metadata: data.metadata,
    //     timestamp: new Date(),
    //   },
    // });

    // For now, just log to Winston
    auditLog(data.operation, data.userId, {
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        changes: data.changes,
        metadata: data.metadata,
    });
}

/**
 * Example usage in routes:
 * 
 * router.post('/', 
 *   auditLogMiddleware('CREATE_EMPLOYER'),
 *   async (req, res, next) => {
 *     try {
 *       const employer = await createEmployer(req.body);
 *       res.status(201).json({ data: employer });
 *     } catch (error) {
 *       next(error);
 *     }
 *   }
 * );
 */

export default auditLogMiddleware;
