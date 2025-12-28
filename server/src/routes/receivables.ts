import { Router } from 'express';
import { z } from 'zod';
import { receivableService } from '../services/receivableService';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const createReceivableSchema = z.object({
    workerId: z.string().uuid(),
    employerId: z.string().uuid(),
    billingCycle: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
    itemDefinitionId: z.string().uuid(),
    amount: z.number().positive(),
    dueDate: z.string().transform(v => new Date(v)),
    type: z.enum(['REGULAR', 'ADJUSTMENT']).optional()
});

const recordPaymentSchema = z.object({
    amount: z.number().positive(),
    paymentDate: z.string().transform(v => new Date(v)),
    paymentMethod: z.enum(['CASH', 'TRANSFER', 'SALARY_DEDUCTION']),
    note: z.string().optional()
});

const adjustmentSchema = z.object({
    amount: z.number(),
    reason: z.string().min(1)
});

const voidTransactionSchema = z.object({
    reason: z.string().min(1)
});

const querySchema = z.object({
    employerIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    workerIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    itemDefinitionIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    billingCycles: z.string().optional().transform(v => v ? v.split(',') : undefined),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.string().optional().transform(v => v ? v.split(',') : undefined),
    type: z.enum(['REGULAR', 'ADJUSTMENT']).optional()
});

// ==========================================
// Routes
// ==========================================

/**
 * GET /api/receivables
 * Query receivables with multi-dimensional filtering
 */
router.get('/', async (req, res, next) => {
    try {
        const query = querySchema.parse(req.query);

        const filter: Parameters<typeof receivableService.queryReceivables>[0] = {
            employerIds: query.employerIds,
            workerIds: query.workerIds,
            itemDefinitionIds: query.itemDefinitionIds,
            billingCycles: query.billingCycles,
            status: query.status,
            type: query.type
        };

        if (query.startDate && query.endDate) {
            filter.dateRange = {
                start: new Date(query.startDate),
                end: new Date(query.endDate)
            };
        }

        const receivables = await receivableService.queryReceivables(filter);
        res.json(receivables);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

/**
 * GET /api/receivables/:id
 * Get a single receivable with transactions
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const receivable = await receivableService.getReceivableById(id);

        if (!receivable) {
            return res.status(404).json({ error: 'Receivable not found' });
        }

        res.json(receivable);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/receivables
 * Create a new receivable
 */
router.post('/', async (req, res, next) => {
    try {
        const data = createReceivableSchema.parse(req.body);
        // TODO: Get user ID from auth middleware
        const createdBy = (req as any).user?.id;

        const receivable = await receivableService.createReceivable({
            ...data,
            createdBy
        });

        res.status(201).json(receivable);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

/**
 * POST /api/receivables/:id/payments
 * Record a payment for a receivable
 */
router.post('/:id/payments', async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = recordPaymentSchema.parse(req.body);
        // TODO: Get user ID from auth middleware
        const createdBy = (req as any).user?.id || 'system';

        const transaction = await receivableService.recordPayment({
            receivableId: id,
            ...data,
            createdBy
        });

        res.status(201).json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('Cannot')) {
                return res.status(400).json({ error: error.message });
            }
        }
        next(error);
    }
});

/**
 * POST /api/receivables/:id/adjustments
 * Create an adjustment for a receivable (補收/退款)
 */
router.post('/:id/adjustments', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, reason } = adjustmentSchema.parse(req.body);
        // TODO: Get user ID from auth middleware
        const createdBy = (req as any).user?.id || 'system';

        const adjustment = await receivableService.createAdjustment(
            id,
            amount,
            reason,
            createdBy
        );

        res.status(201).json(adjustment);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * POST /api/transactions/:id/void
 * Void a transaction
 */
router.post('/transactions/:id/void', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = voidTransactionSchema.parse(req.body);
        // TODO: Get user ID from auth middleware
        const voidedBy = (req as any).user?.id || 'system';

        const result = await receivableService.voidTransaction(id, reason, voidedBy);
        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: error.message });
            }
            if (error.message.includes('already voided')) {
                return res.status(400).json({ error: error.message });
            }
        }
        next(error);
    }
});

/**
 * GET /api/receivables/matrix/:deploymentId
 * Get 36-period billing matrix for a deployment
 */
router.get('/matrix/:deploymentId', async (req, res, next) => {
    try {
        const { deploymentId } = req.params;
        const matrix = await receivableService.getMatrixForDeployment(deploymentId);
        res.json(matrix);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return res.status(404).json({ error: error.message });
        }
        next(error);
    }
});

/**
 * GET /api/receivables/export/excel
 * Export receivables report as Excel
 */
router.get('/export/excel', async (req, res, next) => {
    try {
        const query = querySchema.parse(req.query);

        // Import invoice service for Excel generation
        const { invoiceService } = await import('../services/invoiceService');

        const buffer = await invoiceService.generateReceivablesReportExcel({
            employerIds: query.employerIds,
            workerIds: query.workerIds,
            itemDefinitionIds: query.itemDefinitionIds,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
            status: query.status
        });

        const timestamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="receivables_report_${timestamp}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

/**
 * GET /api/receivables/forecast
 * Get historical + future forecast report
 */
const forecastSchema = z.object({
    employerIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    workerIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM'),
    endMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-MM')
});

router.get('/forecast', async (req, res, next) => {
    try {
        const query = forecastSchema.parse(req.query);

        const { accountingReportService } = await import('../services/accountingReportService');

        const [rows, summary, monthly] = await Promise.all([
            accountingReportService.generateForecastReport({
                employerIds: query.employerIds,
                workerIds: query.workerIds,
                startMonth: query.startMonth,
                endMonth: query.endMonth
            }),
            accountingReportService.getForecastSummary({
                employerIds: query.employerIds,
                workerIds: query.workerIds,
                startMonth: query.startMonth,
                endMonth: query.endMonth
            }),
            accountingReportService.getMonthlyAggregation({
                employerIds: query.employerIds,
                workerIds: query.workerIds,
                startMonth: query.startMonth,
                endMonth: query.endMonth
            })
        ]);

        res.json({ rows, summary, monthly });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

export default router;
