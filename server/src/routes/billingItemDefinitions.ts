import { Router } from 'express';
import { z } from 'zod';
import { BillingItemCategory } from '@prisma/client';
import { billingItemDefinitionService } from '../services/billingItemDefinitionService';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const createSchema = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    nameEn: z.string().max(100).optional(),
    category: z.nativeEnum(BillingItemCategory),
    isSystem: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional()
});

const updateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    nameEn: z.string().max(100).optional(),
    category: z.nativeEnum(BillingItemCategory).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional()
});

const aliasSchema = z.object({
    customName: z.string().min(1).max(100)
});

// ==========================================
// Routes
// ==========================================

/**
 * GET /api/billing-item-definitions
 * List all billing item definitions
 */
router.get('/', async (req, res, next) => {
    try {
        const { isActive, category } = req.query;

        const items = await billingItemDefinitionService.list({
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            category: category as BillingItemCategory | undefined
        });

        res.json(items);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/billing-item-definitions/:id
 * Get a single billing item definition
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const item = await billingItemDefinitionService.getById(id);

        if (!item) {
            return res.status(404).json({ error: 'Billing item definition not found' });
        }

        res.json(item);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/billing-item-definitions
 * Create a new billing item definition
 */
router.post('/', async (req, res, next) => {
    try {
        const data = createSchema.parse(req.body);

        // Check for duplicate code
        const existing = await billingItemDefinitionService.getByCode(data.code);
        if (existing) {
            return res.status(400).json({ error: 'Billing item code already exists' });
        }

        const item = await billingItemDefinitionService.create(data);
        res.status(201).json(item);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
});

/**
 * PUT /api/billing-item-definitions/:id
 * Update a billing item definition
 */
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = updateSchema.parse(req.body);

        const item = await billingItemDefinitionService.update(id, data);
        res.json(item);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        if (error instanceof Error && error.message === 'Billing item definition not found') {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * DELETE /api/billing-item-definitions/:id
 * Delete a billing item definition (non-system only)
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await billingItemDefinitionService.delete(id);
        res.json({ success: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Cannot delete')) {
                return res.status(400).json({ error: error.message });
            }
        }
        next(error);
    }
});

// ==========================================
// Employer Alias Routes
// ==========================================

/**
 * GET /api/billing-item-definitions/employers/:employerId/aliases
 * Get all aliases for an employer
 */
router.get('/employers/:employerId/aliases', async (req, res, next) => {
    try {
        const { employerId } = req.params;
        const aliases = await billingItemDefinitionService.getEmployerAliases(employerId);
        res.json(aliases);
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/billing-item-definitions/:id/employers/:employerId/alias
 * Set or update employer-specific alias
 */
router.put('/:id/employers/:employerId/alias', async (req, res, next) => {
    try {
        const { id, employerId } = req.params;
        const { customName } = aliasSchema.parse(req.body);

        const alias = await billingItemDefinitionService.setEmployerAlias(
            employerId,
            id,
            customName
        );

        res.json(alias);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        next(error);
    }
});

/**
 * DELETE /api/billing-item-definitions/:id/employers/:employerId/alias
 * Remove employer-specific alias
 */
router.delete('/:id/employers/:employerId/alias', async (req, res, next) => {
    try {
        const { id, employerId } = req.params;
        await billingItemDefinitionService.removeEmployerAlias(employerId, id);
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
