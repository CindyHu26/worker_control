import { Router } from 'express';
import { z } from 'zod';
import * as service from '../services/partnerAgencyService';

const router = Router();

// Zod Schema for Validation
const partnerAgencySchema = z.object({
    code: z.string().min(1, "代號為必填"),
    agencyNameZh: z.string().min(1, "公司名稱(中)為必填"),
    agencyNameZhShort: z.string().optional(),
    agencyNameEn: z.string().optional(),
    agencyNameEnShort: z.string().optional(),

    phone: z.string().optional(),
    fax: z.string().optional(),
    email: z.string().email("Email 格式不正確").optional().or(z.literal('')),

    country: z.string().length(2, "國別代碼必須為 2 碼").optional().or(z.literal('')),
    countryNameZh: z.string().optional(),
    addressZh: z.string().optional(),
    addressEn: z.string().optional(),
    addressShort: z.string().optional(),

    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    mailingAddressZh: z.string().optional(),
    mailingAddressEn: z.string().optional(),

    representativeName: z.string().optional(),
    representativeNameEn: z.string().optional(),
    representativeIdNo: z.string().optional(),
    representativePassport: z.string().optional(),

    taxId: z.string().optional(),
    businessRegistrationNo: z.string().optional(),
    permitNumber: z.string().optional(),
    foreignLicenseNo: z.string().optional(),
    foreignLicenseExpiry: z.string().optional(), // Date string

    molPermitNo: z.string().optional(),
    molValidFrom: z.string().optional(), // Date string
    molValidTo: z.string().optional(), // Date string

    payeeName: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountNo: z.string().optional(),
    bankAddress: z.string().optional(),
    loanBankCode: z.string().optional(),

    notes: z.string().optional(),
});

// GET /api/partner-agencies (List)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const country = req.query.country as string;

        const result = await service.getPartnerAgencies({ page, limit, search, country });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch partner agencies' });
    }
});

// GET /api/partner-agencies/:id (Detail)
router.get('/:id', async (req, res) => {
    try {
        const result = await service.getPartnerAgencyById(req.params.id);
        if (!result) return res.status(404).json({ error: 'Partner agency not found' });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch partner agency' });
    }
});

// POST /api/partner-agencies (Create)
router.post('/', async (req, res) => {
    try {
        const body = partnerAgencySchema.parse(req.body);

        // Transform dates string to Date object if present
        const data: any = { ...body };
        if (body.foreignLicenseExpiry) data.foreignLicenseExpiry = new Date(body.foreignLicenseExpiry);
        if (body.molValidFrom) data.molValidFrom = new Date(body.molValidFrom);
        if (body.molValidTo) data.molValidTo = new Date(body.molValidTo);

        const result = await service.createPartnerAgency(data);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Failed to create partner agency' });
    }
});

// PATCH /api/partner-agencies/:id (Update)
router.patch('/:id', async (req, res) => {
    try {
        const body = partnerAgencySchema.partial().parse(req.body);

        const data: any = { ...body };
        if (body.foreignLicenseExpiry) data.foreignLicenseExpiry = new Date(body.foreignLicenseExpiry);
        if (body.molValidFrom) data.molValidFrom = new Date(body.molValidFrom);
        if (body.molValidTo) data.molValidTo = new Date(body.molValidTo);

        const result = await service.updatePartnerAgency(req.params.id, data);
        res.json(result);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: error.errors });
        }
        res.status(500).json({ error: 'Failed to update partner agency' });
    }
});

// DELETE /api/partner-agencies/:id (Delete)
router.delete('/:id', async (req, res) => {
    try {
        await service.deletePartnerAgency(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete partner agency' });
    }
});

export default router;
