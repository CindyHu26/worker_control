import express from 'express';
import { z } from 'zod';
import * as collectionPlanService from '../services/collectionPlanService';

const router = express.Router();

// Zod schemas for validation
const billingCycleSchema = z.object({
    periodStart: z.coerce.number().int().min(1),
    periodEnd: z.coerce.number().int().min(1),
    monthsPerBill: z.coerce.number().int().min(1).default(1),
});

const healthCheckFeeSchema = z.object({
    checkType: z.string().min(1),
    collectionPeriod: z.coerce.number().int().default(0),
    feeMale: z.coerce.number().int().default(0),
    feeFemale: z.coerce.number().int().default(0),
});

const residencePermitSchema = z.object({
    year: z.coerce.number().int().min(1).max(3),
    collectionPeriod: z.coerce.number().int().default(0),
});

const insuranceFeeSchema = z.object({
    year: z.coerce.number().int().min(1).max(3),
    collectionPeriod: z.coerce.number().int().default(0),
    amount: z.coerce.number().int().default(0),
    target: z.enum(['worker', 'employer_account', 'sales_account', 'employer_worker_account', 'sales_worker_account']).optional(),
    sourceType: z.enum(['all', 'renewal_transfer', 'renewal_transfer_mid', 'new_entry', 'renewal', 'transfer', 'mid_skilled']).optional().nullable(),
});

const brokerFeeSchema = z.object({
    feeType: z.enum(['employer', 'worker']),
    collectionPeriod: z.coerce.number().int().default(0),
    amount: z.coerce.number().int().default(0),
    amountMidSkill: z.coerce.number().int().default(0),
    sourceType: z.enum(['all', 'renewal_transfer', 'renewal_transfer_mid', 'new_entry', 'renewal', 'transfer', 'mid_skilled']).optional().nullable(),
});

const employerFeeSchema = z.object({
    year: z.coerce.number().int().min(1).max(3),
    collectionPeriod: z.coerce.number().int().default(0),
    amount: z.coerce.number().int().default(0),
    sourceType: z.enum(['all', 'renewal_transfer', 'renewal_transfer_mid', 'new_entry', 'renewal', 'transfer', 'mid_skilled']).optional().nullable(),
});

const feeItemSchema = z.object({
    feeItemId: z.string().uuid().optional().nullable(),
    amountPerPeriod: z.coerce.number().int().default(0),
    periodStart: z.coerce.number().int().default(0),
    periodEnd: z.coerce.number().int().default(0),
    entryOnly: z.boolean().default(false),
    target: z.enum(['worker', 'employer_account', 'sales_account', 'employer_worker_account', 'sales_worker_account']).default('worker'),
    sortOrder: z.coerce.number().int().default(0),
});

const collectionPlanSchema = z.object({
    code: z.string().min(1, '代號為必填').max(10, '代號最多10字元'),
    nationalityCode: z.string().min(1, '國籍代碼為必填').max(10, '國籍代碼最多10字元'),
    category: z.enum(['household', 'corporate']).default('corporate'),
    salaryCalcMethod: z.enum(['entry_date', 'handover_date', 'handover_next', 'monthly', 'entry_plus_one']).default('monthly'),
    payDay: z.coerce.number().int().min(1).max(31).default(10),
    cutoffDay: z.coerce.number().int().min(1).max(31).default(31),
    calculateByDays: z.boolean().default(true),
    preciseCalculation: z.boolean().default(false),
    monthlySalaryMethod: z.enum(['entry_date', 'handover_date', 'handover_next', 'monthly', 'entry_plus_one']).default('entry_plus_one'),
    isActive: z.boolean().default(true),
    billingCycles: z.array(billingCycleSchema).optional(),
    healthCheckFees: z.array(healthCheckFeeSchema).optional(),
    residencePermits: z.array(residencePermitSchema).optional(),
    insuranceFees: z.array(insuranceFeeSchema).optional(),
    brokerFees: z.array(brokerFeeSchema).optional(),
    employerFees: z.array(employerFeeSchema).optional(),
    feeItems: z.array(feeItemSchema).optional(),
});

// GET /api/collection-plans
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;

        const result = await collectionPlanService.getCollectionPlans(page, limit, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching collection plans:', error);
        res.status(500).json({ error: '無法取得收款計劃列表' });
    }
});

// GET /api/collection-plans/:id
router.get('/:id', async (req, res) => {
    try {
        const item = await collectionPlanService.getCollectionPlanById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: '找不到收款計劃' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error fetching collection plan:', error);
        res.status(500).json({ error: '無法取得收款計劃詳情' });
    }
});

// POST /api/collection-plans
router.post('/', async (req, res) => {
    try {
        const validated = collectionPlanSchema.parse(req.body);
        const newItem = await collectionPlanService.createCollectionPlan(validated as any);
        res.status(201).json(newItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error creating collection plan:', error);
        res.status(500).json({ error: '建立收款計劃失敗' });
    }
});

// PATCH /api/collection-plans/:id
router.patch('/:id', async (req, res) => {
    try {
        const validated = collectionPlanSchema.partial().parse(req.body);
        const updatedItem = await collectionPlanService.updateCollectionPlan(req.params.id, validated as any);
        res.json(updatedItem);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.issues });
        }
        console.error('Error updating collection plan:', error);
        res.status(500).json({ error: '更新收款計劃失敗' });
    }
});

// DELETE /api/collection-plans/:id
router.delete('/:id', async (req, res) => {
    try {
        await collectionPlanService.deleteCollectionPlan(req.params.id);
        res.json({ message: '刪除成功' });
    } catch (error) {
        console.error('Error deleting collection plan:', error);
        res.status(500).json({ error: '刪除收款計劃失敗' });
    }
});

export default router;
