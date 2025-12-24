import { Router, Request, Response } from 'express';
import { z } from 'zod';
import * as domesticAgencyService from '../services/domesticAgencyService';

const router = Router();

const createSchema = z.object({
    code: z.string().min(1, '代號為必填').max(10),
    agencyNameZh: z.string().min(1, '公司名稱（中文）為必填').max(100),
    agencyNameEn: z.string().max(100).optional().nullable(),
    agencyNameShort: z.string().max(50).optional().nullable(),

    // Contact Info
    phone: z.string().max(20).optional().nullable(),
    fax: z.string().max(20).optional().nullable(),
    email: z.string().email('請輸入有效的電子郵件').or(z.literal('')).optional().nullable(),
    emergencyEmail: z.string().max(255).optional().nullable(),
    website: z.string().max(100).optional().nullable(),
    customerServicePhone: z.string().max(20).optional().nullable(),
    emergencyPhone: z.string().max(20).optional().nullable(),

    // Address
    zipCode: z.string().max(5).optional().nullable(),
    cityCode: z.string().max(3).optional().nullable(),
    addressZh: z.string().max(200).optional().nullable(),
    addressEn: z.string().max(200).optional().nullable(),

    // Representative
    representativeName: z.string().max(50).optional().nullable(),
    representativeNameEn: z.string().max(100).optional().nullable(),
    representativeIdNo: z.string().max(20).optional().nullable(),
    representativePassport: z.string().max(20).optional().nullable(),
    checkPayableTo: z.string().max(50).optional().nullable(),

    // Company Licenses
    taxId: z.string().max(10).optional().nullable(),
    taxRegistrationNo: z.string().max(20).optional().nullable(),
    permitNumber: z.string().max(20).optional().nullable(),
    permitValidFrom: z.string().optional().nullable(),
    permitValidTo: z.string().optional().nullable(),
    businessRegistrationNo: z.string().max(50).optional().nullable(),

    // Bank Info
    postalAccountNo: z.string().max(20).optional().nullable(),
    postalAccountName: z.string().max(100).optional().nullable(),
    bankName: z.string().max(100).optional().nullable(),
    bankCode: z.string().max(3).optional().nullable(),
    bankBranchCode: z.string().max(4).optional().nullable(),
    bankAccountNo: z.string().max(20).optional().nullable(),
    bankAccountName: z.string().max(100).optional().nullable(),

    // Internal
    accountant: z.string().max(50).optional().nullable(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
});

const updateSchema = createSchema.partial();

router.get('/', async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 20;
        const search = req.query.search as string;

        const result = await domesticAgencyService.getDomesticAgencies(page, pageSize, search);
        res.json(result);
    } catch (error) {
        console.error('Error fetching domestic agencies:', error);
        res.status(500).json({ error: 'Failed to fetch domestic agencies' });
    }
});

router.get('/:id', async (req: Request, res: Response) => {
    try {
        const agency = await domesticAgencyService.getDomesticAgencyById(req.params.id);
        if (!agency) {
            return res.status(404).json({ error: 'Domestic agency not found' });
        }
        res.json(agency);
    } catch (error) {
        console.error('Error fetching domestic agency:', error);
        res.status(500).json({ error: 'Failed to fetch domestic agency' });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const validatedData = createSchema.parse(req.body);

        // Convert date strings to Date objects
        const dataToCreate: any = { ...validatedData };
        if (validatedData.permitValidFrom) {
            dataToCreate.permitValidFrom = new Date(validatedData.permitValidFrom);
        }
        if (validatedData.permitValidTo) {
            dataToCreate.permitValidTo = new Date(validatedData.permitValidTo);
        }

        const newAgency = await domesticAgencyService.createDomesticAgency(dataToCreate);
        res.status(201).json(newAgency);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error creating domestic agency:', error);
        res.status(500).json({ error: 'Failed to create domestic agency' });
    }
});

router.put('/:id', async (req: Request, res: Response) => {
    try {
        const validatedData = updateSchema.parse(req.body);

        // Convert date strings to Date objects
        const dataToUpdate: any = { ...validatedData };
        if (validatedData.permitValidFrom) {
            dataToUpdate.permitValidFrom = new Date(validatedData.permitValidFrom);
        }
        if (validatedData.permitValidTo) {
            dataToUpdate.permitValidTo = new Date(validatedData.permitValidTo);
        }

        const updatedAgency = await domesticAgencyService.updateDomesticAgency(req.params.id, dataToUpdate);
        res.json(updatedAgency);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ errors: (error as any).issues });
        }
        console.error('Error updating domestic agency:', error);
        res.status(500).json({ error: 'Failed to update domestic agency' });
    }
});

router.delete('/:id', async (req: Request, res: Response) => {
    try {
        await domesticAgencyService.deleteDomesticAgency(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting domestic agency:', error);
        res.status(500).json({ error: 'Failed to delete domestic agency' });
    }
});

export default router;
