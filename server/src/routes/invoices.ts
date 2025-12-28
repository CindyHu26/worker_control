import { Router } from 'express';
import { z } from 'zod';
import { invoiceService } from '../services/invoiceService';

const router = Router();

// ==========================================
// Validation Schemas
// ==========================================

const createInvoiceSchema = z.object({
    payerType: z.enum(['EMPLOYER', 'WORKER']),
    payerId: z.string().uuid(),
    dueDate: z.string().transform(v => new Date(v)),
    receivableIds: z.array(z.string().uuid()).min(1),
    notes: z.string().optional()
});

const querySchema = z.object({
    payerType: z.enum(['EMPLOYER', 'WORKER']).optional(),
    payerIds: z.string().optional().transform(v => v ? v.split(',') : undefined),
    status: z.string().optional().transform(v => v ? v.split(',') : undefined),
    startDate: z.string().optional(),
    endDate: z.string().optional()
});

const updateStatusSchema = z.object({
    status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED'])
});

// ==========================================
// Routes
// ==========================================

/**
 * GET /api/invoices
 * List all invoices with optional filtering
 */
router.get('/', async (req, res, next) => {
    try {
        const query = querySchema.parse(req.query);

        const filter: Parameters<typeof invoiceService.listInvoices>[0] = {
            payerType: query.payerType,
            payerIds: query.payerIds,
            status: query.status
        };

        if (query.startDate && query.endDate) {
            filter.dateRange = {
                start: new Date(query.startDate),
                end: new Date(query.endDate)
            };
        }

        const invoices = await invoiceService.listInvoices(filter);
        res.json(invoices);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

/**
 * GET /api/invoices/:id
 * Get single invoice with details
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const invoice = await invoiceService.getInvoiceById(id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/invoices
 * Create a new invoice from selected receivables
 */
router.post('/', async (req, res, next) => {
    try {
        const data = createInvoiceSchema.parse(req.body);
        // TODO: Get user ID from auth middleware
        const createdBy = (req as any).user?.id || 'system';

        const invoice = await invoiceService.createInvoice({
            ...data,
            createdBy
        });

        res.status(201).json(invoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error) {
            if (error.message.includes('No valid') || error.message.includes('already paid')) {
                return res.status(400).json({ error: error.message });
            }
        }
        next(error);
    }
});

/**
 * PUT /api/invoices/:id/status
 * Update invoice status
 */
router.put('/:id/status', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = updateStatusSchema.parse(req.body);

        const invoice = await invoiceService.updateInvoiceStatus(id, status);
        res.json(invoice);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        next(error);
    }
});

/**
 * GET /api/invoices/:id/excel
 * Download invoice as Excel file
 */
router.get('/:id/excel', async (req, res, next) => {
    try {
        const { id } = req.params;

        const invoice = await invoiceService.getInvoiceById(id);
        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const buffer = await invoiceService.generateInvoiceExcel(id);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNo}.xlsx"`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
});

export default router;
