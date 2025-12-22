
import { Router } from 'express';
import prisma from '../prisma';
import { updateEmployer, getEmployerSummary, createEmployer, searchEmployers, deleteEmployer } from '../services/employerService';
import { z } from 'zod';

const router = Router();

// Define validation schemas locally or export from service
const FactoryAttrs = z.object({
    factoryRegistrationNo: z.string().optional(),
    industryCode: z.string().optional(),
    industryType: z.string().optional(),
    factoryAddress: z.string().optional(),
    factoryAddressEn: z.string().optional(),
});

const CaretakerAttrs = z.object({
    patientName: z.string().optional(),
    hospitalCertNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),
    patientIdNo: z.string().optional() // Make strict if needed
});

// Check Duplicate Tax ID
router.get('/check-duplicate/:taxId', async (req, res) => {
    try {
        const { taxId } = req.params;
        const existing = await prisma.employer.findUnique({
            where: { taxId },
            select: { id: true, companyName: true }
        });
        res.json({ exists: !!existing, employer: existing });
    } catch (error) {
        res.status(500).json({ error: 'Failed to check duplicate' });
    }
});

// Zod Schema for Employer Creation with Type Coercion
const createEmployerSchema = z.object({
    companyName: z.string().optional(),
    companyNameEn: z.string().optional(),

    // New Fields
    code: z.string().optional(),
    shortName: z.string().optional(),
    referrer: z.string().optional(),
    taxAddress: z.string().optional(),
    healthBillAddress: z.string().optional(),
    healthBillZip: z.string().optional(),

    taxId: z.string().optional(),
    responsiblePerson: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    addressEn: z.string().optional(),
    invoiceAddress: z.string().optional(),
    faxNumber: z.string().optional(),
    email: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    // Corporate Fields with type coercion
    factoryRegistrationNo: z.string().optional(),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    factoryAddress: z.string().optional(),
    capital: z.coerce.number().optional(),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(), // New
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(), // New
    institutionCode: z.string().optional(),
    bedCount: z.coerce.number().optional(),
    avgDomesticWorkers: z.coerce.number().optional(),

    // 3K5 & Compliance
    // Loosen validation to accept string or number
    allocationRate: z.union([z.string(), z.number()]).optional(),
    isExtra: z.boolean().optional(),
    baseRate: z.string().optional(),
    extraRate: z.string().optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),

    // Add category for frontend compatibility
    category: z.string().optional(),
    isCorporate: z.boolean().optional(),

    // Individual Fields
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    // New Individual Fields
    englishName: z.string().optional(),
    birthPlace: z.string().optional(),
    birthPlaceEn: z.string().optional(),
    residenceAddress: z.string().optional(),
    residenceZip: z.string().optional(),
    residenceCityCode: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),
    idIssueDate: z.string().optional(),
    idIssuePlace: z.string().optional(),


    // Home Care Fields
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Factories
    factories: z.array(z.object({
        name: z.string(),
        factoryRegNo: z.string().optional(),
        address: z.string().optional(),
        addressEn: z.string().optional(),
        zipCode: z.string().optional(),
        cityCode: z.string().optional(),
        laborCount: z.coerce.number().optional(),
        foreignCount: z.coerce.number().optional()
    })).optional(),

    // Initial Recruitment Letters (optional array)
    initialRecruitmentLetters: z.array(z.object({
        letterNumber: z.string().min(1, "函文號必填"),
        issueDate: z.coerce.date(), // Type coercion for date
        expiryDate: z.coerce.date(), // Type coercion for date
        approvedQuota: z.coerce.number().min(1, "核准名額必須大於0"), // Type coercion for number
    })).optional(),
});

// GET /api/employers
router.get('/', async (req, res, next) => {
    try {
        const result = await searchEmployers(req.query as any);
        res.json(result);
    } catch (error) {
        next(error);
    }
});


// Create Employer
router.post('/', async (req, res, next) => {
    try {
        const newEmployer = await createEmployer(req.body);
        res.status(201).json({ data: newEmployer });
    } catch (error) {
        next(error); // Global error handler will process ZodError, DuplicateResourceError, etc.
    }
});

// Create Recruitment Letter
router.post('/:id/recruitment-letters', async (req, res) => {
    try {
        const { id } = req.params; // Employer ID
        const body = req.body;

        console.log('Creating recruitment letter with data:', JSON.stringify(body, null, 2));

        const newLetter = await prisma.employerRecruitmentLetter.create({
            data: {
                employerId: id,
                letterNumber: body.letterNumber,
                issueDate: new Date(body.issueDate),
                expiryDate: new Date(body.expiryDate),
                approvedQuota: Number(body.approvedQuota),
                usedQuota: 0, // Initial used is 0

                // New Fields - handle empty strings
                submissionDate: body.submissionDate && body.submissionDate !== '' ? new Date(body.submissionDate) : null,
                laborMinistryReceiptDate: body.laborMinistryReceiptDate && body.laborMinistryReceiptDate !== '' ? new Date(body.laborMinistryReceiptDate) : null,

                issueUnit: body.issueUnit || null,
                issueWord: body.issueWord || null,
                caseNumber: body.caseNumber || null,

                workAddress: body.workAddress || null,
                jobType: body.jobType || null,
                jobTitle: body.jobTitle || null,
                industryCode: body.industryCode || null,

                projectCode: body.projectCode || null,
                industrialBureauRef: body.industrialBureauRef || null,

                quotaMale: body.quotaMale ? Number(body.quotaMale) : 0,
                quotaFemale: body.quotaFemale ? Number(body.quotaFemale) : 0,

                recruitmentType: body.recruitmentType || null,
                nationality: body.nationality || null,
                canCirculate: body.canCirculate !== undefined ? body.canCirculate : true,
                remarks: body.remarks || null
            }
        });

        res.json(newLetter);
    } catch (error: any) {
        console.error('Error creating recruitment letter:', error);
        console.error('Request body was:', JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: 'Failed to create recruitment letter', details: error.message });
    }
});

// Update Recruitment Letter
router.put('/:id/recruitment-letters/:letterId', async (req, res) => {
    try {
        const { id, letterId } = req.params;
        const body = req.body;

        // Verify ownership
        const existing = await prisma.employerRecruitmentLetter.findUnique({
            where: { id: letterId }
        });

        if (!existing || existing.employerId !== id) {
            return res.status(404).json({ error: 'Recruitment Letter not found' });
        }

        const updatedLetter = await prisma.employerRecruitmentLetter.update({
            where: { id: letterId },
            data: {
                letterNumber: body.letterNumber,
                issueDate: body.issueDate && body.issueDate !== '' ? new Date(body.issueDate) : undefined,
                expiryDate: body.expiryDate && body.expiryDate !== '' ? new Date(body.expiryDate) : undefined,
                approvedQuota: body.approvedQuota ? Number(body.approvedQuota) : undefined,

                submissionDate: body.submissionDate && body.submissionDate !== '' ? new Date(body.submissionDate) : null,
                laborMinistryReceiptDate: body.laborMinistryReceiptDate && body.laborMinistryReceiptDate !== '' ? new Date(body.laborMinistryReceiptDate) : null,

                issueUnit: body.issueUnit || null,
                issueWord: body.issueWord || null,
                caseNumber: body.caseNumber || null,

                workAddress: body.workAddress || null,
                jobType: body.jobType || null,
                jobTitle: body.jobTitle || null,
                industryCode: body.industryCode || null,

                projectCode: body.projectCode || null,
                industrialBureauRef: body.industrialBureauRef || null,

                quotaMale: body.quotaMale ? Number(body.quotaMale) : 0,
                quotaFemale: body.quotaFemale ? Number(body.quotaFemale) : 0,

                recruitmentType: body.recruitmentType || null,
                nationality: body.nationality || null,
                canCirculate: body.canCirculate,
                remarks: body.remarks || null
            }
        });

        res.json(updatedLetter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update recruitment letter' });
    }
});

// Delete Letter
router.delete('/:id/recruitment-letters/:letterId', async (req, res) => {
    try {
        const { letterId } = req.params;

        // Check if cached usedQuota is > 0 (Soft check)
        const letter = await prisma.employerRecruitmentLetter.findUnique({
            where: { id: letterId },
            include: { _count: { select: { deployments: true } } }
        });

        if (letter && letter._count.deployments > 0) {
            return res.status(400).json({ error: 'Cannot delete letter with associated deployments.' });
        }

        await prisma.employerRecruitmentLetter.delete({
            where: { id: letterId }
        });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete recruitment letter' });
    }
});

// GET /api/employers/:id
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [employer, summary] = await Promise.all([
            prisma.employer.findUnique({
                where: { id },
                include: {
                    corporateInfo: true,
                    individualInfo: true,
                    factories: true,
                    recruitmentLetters: {
                        orderBy: { issueDate: 'desc' },
                        include: {
                            deployments: true
                        }
                    },
                    deployments: { where: { status: 'active' } },
                    industryRecognitions: {
                        orderBy: { issueDate: 'desc' },
                        take: 1
                    }
                }
            }),
            getEmployerSummary(id)
        ]);

        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        res.json({
            ...employer,
            summary
        });
    } catch (error) {
        console.error('Get Employer Error:', error);
        res.status(500).json({ error: 'Failed to fetch employer' });
    }
});

// PUT /api/employers/:id (Update Employer)
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await updateEmployer(id, req.body);
        res.json(updated);
    } catch (error) {
        console.error('Update Employer Error:', error);
        res.status(500).json({ error: 'Failed to update employer' });
    }
});

// DELETE /api/employers/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        await deleteEmployer(id);
        res.json({ success: true, message: 'Employer deleted successfully' });
    } catch (error) {
        next(error); // ResourceNotFoundError, ValidationError handled by global handler
    }
});

export default router;
