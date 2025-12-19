
import { Router } from 'express';
import prisma from '../prisma';
import { updateEmployer, getEmployerSummary } from '../services/employerService';
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
    companyName: z.string().min(1, "公司名稱必填"),
    companyNameEn: z.string().optional(),
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
    healthInsuranceUnitNo: z.string().optional(),
    institutionCode: z.string().optional(),
    bedCount: z.coerce.number().optional(),
    avgDomesticWorkers: z.coerce.number().optional(),

    // 3K5 & Compliance
    allocationRate: z.enum(['0.10', '0.15', '0.20', '0.25', '0.30', '0.35', '0.40']).optional(),
    isExtra: z.boolean().optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),

    // Individual Fields
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),

    // Home Care Fields
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Initial Recruitment Letters (optional array)
    initialRecruitmentLetters: z.array(z.object({
        letterNumber: z.string().min(1, "函文號必填"),
        issueDate: z.coerce.date(), // Type coercion for date
        expiryDate: z.coerce.date(), // Type coercion for date
        approvedQuota: z.coerce.number().min(1, "核准名額必須大於0"), // Type coercion for number
    })).optional(),
});

// GET /api/employers
router.get('/', async (req, res) => {
    try {
        const { q, page = '1', limit = '10', type } = req.query; // type can be 'corporate' or 'individual'

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};
        if (type === 'corporate') {
            whereClause.corporateInfo = { isNot: null };
        } else if (type === 'individual') {
            whereClause.individualInfo = { isNot: null };
        }

        if (q) {
            const keyword = q as string;
            whereClause.OR = [
                { companyName: { contains: keyword, mode: 'insensitive' } },
                { taxId: { contains: keyword } },
                { responsiblePerson: { contains: keyword } }
            ];
        }

        const [total, employers] = await Promise.all([
            prisma.employer.count({ where: whereClause }),
            prisma.employer.findMany({
                where: whereClause,
                include: {
                    corporateInfo: true,
                    individualInfo: true,
                    _count: {
                        select: { deployments: { where: { status: 'active' } } }
                    }
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        res.json({
            data: employers,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Search Employers Error:', error);
        res.status(500).json({ error: 'Failed to search employers' });
    }
});

// Create Employer
router.post('/', async (req, res) => {
    try {
        // Validate and parse request body with Zod
        const validatedData = createEmployerSchema.parse(req.body);

        const {
            companyName,
            taxId,
            responsiblePerson,
            phoneNumber,
            address,
            invoiceAddress,
            faxNumber,
            email,
            // Corporate Fields
            factoryRegistrationNo,
            industryType,
            industryCode,
            factoryAddress,
            laborInsuranceNo,
            healthInsuranceUnitNo,
            institutionCode,
            bedCount,
            // 3K5 & Compliance
            allocationRate,
            complianceStandard,
            zeroFeeEffectiveDate,
            // Individual Fields
            responsiblePersonIdNo,
            responsiblePersonDob,
            responsiblePersonSpouse,
            responsiblePersonFather,
            responsiblePersonMother,
            // Home Care Fields
            patientName,
            patientIdNo,
            careAddress,
            relationship,
            // Manufacturing Specific
            avgDomesticWorkers,
            // Initial Recruitment Letters
            initialRecruitmentLetters
        } = validatedData;

        // Check uniqueness if taxId is provided
        if (taxId) {
            const existing = await prisma.employer.findUnique({
                where: { taxId }
            });
            if (existing) {
                return res.status(400).json({ message: 'Tax ID / ID Number already exists' });
            }
        }

        // Infer Type
        const isCorporate = !!(factoryRegistrationNo || industryType || laborInsuranceNo || institutionCode);
        const isIndividual = !!(responsiblePersonIdNo || responsiblePersonSpouse || patientName || taxId?.length === 10);

        // Transactional Create with Nested Recruitment Letters
        const newEmployer = await prisma.$transaction(async (tx) => {
            const data: any = {
                companyName: String(companyName),
                companyNameEn: validatedData.companyNameEn,
                taxId: taxId ? String(taxId) : undefined,
                responsiblePerson: responsiblePerson ? String(responsiblePerson) : undefined,
                phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
                address: address ? String(address) : undefined,
                addressEn: validatedData.addressEn,
                invoiceAddress: invoiceAddress ? String(invoiceAddress) : undefined,
                email: email ? String(email) : undefined,
                contactPerson: validatedData.contactPerson,
                contactPhone: validatedData.contactPhone,

                // 3K5 & Compliance
                allocationRate: allocationRate ? Number(allocationRate) : undefined,
                complianceStandard: complianceStandard || 'NONE',
                zeroFeeEffectiveDate: zeroFeeEffectiveDate ? new Date(zeroFeeEffectiveDate) : undefined,
            };

            if (isCorporate) {
                data.corporateInfo = {
                    create: {
                        factoryRegistrationNo,
                        industryType,
                        industryCode: validatedData.industryCode,
                        factoryAddress,
                        capital: validatedData.capital ? Number(validatedData.capital) : undefined,
                        laborInsuranceNo,
                        healthInsuranceUnitNo,
                        faxNumber,
                        institutionCode,
                        bedCount: bedCount,
                        industryAttributes: {
                            isExtra: validatedData.isExtra || false
                        }
                    }
                };
            } else if (isIndividual) {
                data.individualInfo = {
                    create: {
                        responsiblePersonIdNo: responsiblePersonIdNo || (taxId?.length === 10 ? taxId : undefined),
                        responsiblePersonSpouse,
                        responsiblePersonFather,
                        responsiblePersonMother,
                        responsiblePersonDob: responsiblePersonDob ? new Date(responsiblePersonDob) : undefined,
                        patientName,
                        patientIdNo,
                        careAddress,
                        relationship
                    }
                };
            }

            // Add nested recruitment letters if provided
            if (initialRecruitmentLetters && initialRecruitmentLetters.length > 0) {
                data.recruitmentLetters = {
                    create: initialRecruitmentLetters.map(letter => ({
                        letterNumber: letter.letterNumber,
                        issueDate: letter.issueDate,
                        expiryDate: letter.expiryDate,
                        approvedQuota: letter.approvedQuota,
                        usedQuota: 0
                    }))
                };
            }

            const emp = await tx.employer.create({
                data,
                include: {
                    recruitmentLetters: true
                }
            });

            // If Manufacturing AND domestic workers count provided, create initial labor count record
            if (isCorporate && industryType === 'MANUFACTURING' && avgDomesticWorkers && avgDomesticWorkers > 0) {
                const now = new Date();
                await tx.employerLaborCount.create({
                    data: {
                        employerId: emp.id,
                        year: now.getFullYear(),
                        month: now.getMonth() + 1,
                        count: Number(avgDomesticWorkers)
                    }
                });
            }

            return emp;
        });

        res.status(201).json(newEmployer);
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "資料驗證失敗",
                errors: error.issues.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            });
        }

        console.error('Create Employer Error:', error);
        res.status(500).json({ message: 'Failed to create employer', error: String(error) });
    }
});

// Create Recruitment Letter
router.post('/:id/recruitment-letters', async (req, res) => {
    try {
        const { id } = req.params; // Employer ID
        const { letterNumber, issueDate, expiryDate, approvedQuota } = req.body;

        const newLetter = await prisma.employerRecruitmentLetter.create({
            data: {
                employerId: id,
                letterNumber,
                issueDate: new Date(issueDate),
                expiryDate: new Date(expiryDate),
                approvedQuota: Number(approvedQuota),
                usedQuota: 0 // Initial used is 0
            }
        });

        res.json(newLetter);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create recruitment letter' });
    }
});

// Delete Letter (Optional but good for management)
router.delete('/:id/recruitment-letters/:letterId', async (req, res) => {
    try {
        const { letterId } = req.params;
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
                    recruitmentLetters: {
                        orderBy: { issueDate: 'desc' },
                        include: {
                            deployments: true
                        }
                    },
                    _count: {
                        select: {
                            deployments: { where: { status: 'active' } }
                        }
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

export default router;
