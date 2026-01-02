/**
 * Universal Data Router
 * 
 * Generic CRUD API for the Universal Entity Architecture.
 * Handles reads/writes based on metadata stored in EntitySchema table.
 * 
 * Route pattern: /api/data/:entity
 */

import { Router, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ==========================================
// Dynamic Model Resolution (Prisma Map)
// ==========================================

/**
 * Allowed entities for the generic API.
 * Maps URL entity names (lowercase) to Prisma model delegates.
 * Only entities explicitly listed here can be accessed via this API.
 */
type PrismaModelDelegate = {
    findMany: (args?: any) => Promise<any[]>;
    findUnique: (args: any) => Promise<any | null>;
    create: (args: any) => Promise<any>;
    update: (args: any) => Promise<any>;
    delete: (args: any) => Promise<any>;
    count: (args?: any) => Promise<number>;
};

const ALLOWED_ENTITIES: Record<string, PrismaModelDelegate> = {
    worker: prisma.worker,
    employer: prisma.employer,
    // Add more entities here as they adopt the hybrid model
    // dormitory: prisma.dormitory,
    // agency: prisma.agency,
};

/**
 * Resolves entity name from URL to Prisma model delegate.
 * Returns null if entity is not allowed or doesn't exist.
 */
function getModelDelegate(entityCode: string): PrismaModelDelegate | null {
    const normalized = entityCode.toLowerCase();
    return ALLOWED_ENTITIES[normalized] || null;
}

// ==========================================
// GET /:entity/schema - Schema Definition
// ==========================================

router.get('/:entity/schema', async (req: AuthRequest, res: Response) => {
    try {
        const { entity } = req.params;
        const entityCode = entity.toLowerCase();

        // Verify entity exists in allowed list
        if (!getModelDelegate(entityCode)) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        // Fetch schema fields from EntitySchema table
        const schemaFields = await prisma.entitySchema.findMany({
            where: { entityCode },
            orderBy: { fieldOrder: 'asc' },
        });

        if (schemaFields.length === 0) {
            return res.status(404).json({
                error: 'Schema not found',
                message: `No schema definition found for entity '${entity}'.`,
            });
        }

        // Transform to frontend-compatible format
        const formConfig = schemaFields.map((field) => ({
            name: field.fieldName,
            label: field.label,
            type: field.fieldType,
            isCore: field.isCore,
            group: field.fieldGroup,
            options: field.options,
            validation: field.validation,
            order: field.fieldOrder,
        }));

        return res.json({
            entityCode,
            fields: formConfig,
            meta: {
                totalFields: formConfig.length,
                coreFields: formConfig.filter((f) => f.isCore).length,
                dynamicFields: formConfig.filter((f) => !f.isCore).length,
            },
        });
    } catch (error) {
        console.error('[data.ts] GET /:entity/schema error:', error);
        return res.status(500).json({ error: 'Failed to fetch schema definition' });
    }
});

// ==========================================
// GET /:entity - List with Pagination
// ==========================================

router.get('/:entity', async (req: AuthRequest, res: Response) => {
    try {
        const { entity } = req.params;
        const model = getModelDelegate(entity);

        if (!model) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        // Pagination params
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
        const skip = (page - 1) * limit;

        // Sorting params
        const sortBy = (req.query.sortBy as string) || 'createdAt';
        const sortOrder = ((req.query.sortOrder as string) || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

        // Search/filter params (optional - simple text search)
        const search = req.query.search as string;

        // Build where clause (basic search on common text fields)
        let where: any = {};
        if (search) {
            // Generic search - will work for entities with these common fields
            where = {
                OR: [
                    { englishName: { contains: search, mode: 'insensitive' } },
                    { companyName: { contains: search, mode: 'insensitive' } },
                    { passportNo: { contains: search, mode: 'insensitive' } },
                ].filter(Boolean),
            };
        }

        // Fetch data and count in parallel
        const [data, total] = await Promise.all([
            model.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            model.count({ where }),
        ]);

        return res.json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        });
    } catch (error) {
        console.error('[data.ts] GET /:entity error:', error);

        // Handle Prisma errors gracefully
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2009') {
                return res.status(400).json({
                    error: 'Invalid query',
                    message: 'Invalid sort field or filter parameter.',
                });
            }
        }

        return res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// ==========================================
// GET /:entity/:id - Get Single Record
// ==========================================

router.get('/:entity/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { entity, id } = req.params;
        const model = getModelDelegate(entity);

        if (!model) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        const record = await model.findUnique({
            where: { id },
        });

        if (!record) {
            return res.status(404).json({
                error: 'Record not found',
                message: `No ${entity} found with ID '${id}'.`,
            });
        }

        return res.json(record);
    } catch (error) {
        console.error('[data.ts] GET /:entity/:id error:', error);
        return res.status(500).json({ error: 'Failed to fetch record' });
    }
});

// ==========================================
// POST /:entity - Create (Hybrid Handler)
// ==========================================

router.post('/:entity', async (req: AuthRequest, res: Response) => {
    try {
        const { entity } = req.params;
        const model = getModelDelegate(entity);

        if (!model) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        // The payload comes with core fields at root level
        // and dynamic fields inside `attributes` object.
        // Prisma handles JSONB mapping automatically.
        const payload = req.body;

        // Add audit fields if available
        if (req.user?.id) {
            payload.createdBy = req.user.id;
        }

        const created = await model.create({
            data: payload,
        });

        return res.status(201).json(created);
    } catch (error) {
        console.error('[data.ts] POST /:entity error:', error);

        // Handle Prisma errors gracefully
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Unique constraint violation
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[])?.join(', ') || 'unknown field';
                return res.status(409).json({
                    error: 'Conflict',
                    message: `A record with this ${target} already exists.`,
                    field: target,
                });
            }
            // Foreign key constraint
            if (error.code === 'P2003') {
                return res.status(400).json({
                    error: 'Invalid reference',
                    message: 'One or more referenced records do not exist.',
                });
            }
            // Required field missing
            if (error.code === 'P2011' || error.code === 'P2012') {
                return res.status(400).json({
                    error: 'Validation error',
                    message: 'Required fields are missing.',
                });
            }
        }

        return res.status(500).json({ error: 'Failed to create record' });
    }
});

// ==========================================
// PUT /:entity/:id - Update (Hybrid Handler)
// ==========================================

router.put('/:entity/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { entity, id } = req.params;
        const model = getModelDelegate(entity);

        if (!model) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        // Check if record exists first
        const existing = await model.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                error: 'Record not found',
                message: `No ${entity} found with ID '${id}'.`,
            });
        }

        // The payload comes with core fields at root level
        // and dynamic fields inside `attributes` object.
        const payload = req.body;

        // Add audit fields if available
        if (req.user?.id) {
            payload.updatedBy = req.user.id;
        }

        const updated = await model.update({
            where: { id },
            data: payload,
        });

        return res.json(updated);
    } catch (error) {
        console.error('[data.ts] PUT /:entity/:id error:', error);

        // Handle Prisma errors gracefully
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = (error.meta?.target as string[])?.join(', ') || 'unknown field';
                return res.status(409).json({
                    error: 'Conflict',
                    message: `A record with this ${target} already exists.`,
                    field: target,
                });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({
                    error: 'Record not found',
                    message: 'The record you are trying to update does not exist.',
                });
            }
        }

        return res.status(500).json({ error: 'Failed to update record' });
    }
});

// ==========================================
// DELETE /:entity/:id - Delete Record
// ==========================================

router.delete('/:entity/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { entity, id } = req.params;
        const model = getModelDelegate(entity);

        if (!model) {
            return res.status(404).json({
                error: 'Entity not found',
                message: `Entity '${entity}' is not available or not supported.`,
            });
        }

        // Check if record exists first
        const existing = await model.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({
                error: 'Record not found',
                message: `No ${entity} found with ID '${id}'.`,
            });
        }

        await model.delete({ where: { id } });

        return res.status(204).send();
    } catch (error) {
        console.error('[data.ts] DELETE /:entity/:id error:', error);

        // Handle Prisma errors gracefully
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Foreign key constraint (record has dependencies)
            if (error.code === 'P2003') {
                return res.status(409).json({
                    error: 'Conflict',
                    message: 'Cannot delete: This record has dependent records.',
                });
            }
        }

        return res.status(500).json({ error: 'Failed to delete record' });
    }
});

export default router;
