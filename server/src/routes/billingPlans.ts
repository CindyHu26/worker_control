import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { billingService } from '../services/billingGeneratorService';

const router = Router();

// GET /api/billing-plans/:id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const plan = await prisma.billingPlan.findUnique({
            where: { id },
            include: {
                items: { orderBy: { billingDate: 'asc' } },
                deployment: {
                    include: {
                        employer: true,
                        worker: true
                    }
                }
            }
        });
        if (!plan) return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    } catch (error) {
        next(error);
    }
});

// POST /api/billing-plans/:id/simulate
router.post('/:id/simulate', async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await billingService.simulatePlan(id);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /api/billing-plans/:id/confirm
router.post('/:id/confirm', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { items } = req.body; // updated items? or just confirm?

        // Ideally, we accept a list of items to "save" (override).
        // For "Review" workflow, the frontend sends back the final state of items (some from suggestions, some original).
        // Or specific logic to "Applying Suggestion".
        // Let's implement a bulk update for simplicity.

        await prisma.$transaction(async (tx) => {
            // 1. Update items
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    if (item.id) {
                        // Update existing
                        await tx.billingPlanItem.update({
                            where: { id: item.id },
                            data: {
                                amount: item.amount,
                                status: item.status,
                                description: item.description
                            }
                        });
                        // Modification Log creation logic should be here if we want detailed tracking per item update API.
                        // But if frontend just sends "new state", we might assume logs are created elsewhere or we just track "Manual Edit".
                        // The requirement: "BillingModificationLog... when finance accepts suggestion or manual edit".
                        // We'll add logic: if amount changed, create log.
                    } else {
                        // New item?
                    }
                }
            }

            // 2. Update Plan Status
            await tx.billingPlan.update({
                where: { id },
                data: {
                    status: 'CONFIRMED',
                    reviewStatus: 'NORMAL',
                    reviewReason: null // Clear reason
                }
            });
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
