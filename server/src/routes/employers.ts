
import { Router } from 'express';
import prisma from '../prisma';
import { updateEmployer } from '../services/employerService';
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
        const {
            companyName,
            taxId,
            responsiblePerson,
            phoneNumber,
            address,
            faxNumber, // Now on CorporateInfo or Employer?
            email,
            // Corporate Fields
            factoryRegistrationNo,
            industryType,
            laborInsuranceNo,
            healthInsuranceUnitNo,
            // Individual Fields
            responsiblePersonIdNo,
            responsiblePersonDob,
            responsiblePersonSpouse,
            responsiblePersonFather,
            responsiblePersonMother
        } = req.body;

        if (!companyName) {
            return res.status(400).json({ error: 'Company name is required' });
        }

        // Check uniqueness if taxId is provided
        if (taxId) {
            const existing = await prisma.employer.findUnique({
                where: { taxId }
            });
            if (existing) {
                return res.status(400).json({ error: 'Tax ID / ID Number already exists' });
            }
        }

        // Infer Type
        const isCorporate = !!(factoryRegistrationNo || industryType || laborInsuranceNo);
        const isIndividual = !!(responsiblePersonIdNo || responsiblePersonSpouse);

        // Transactional Create
        const newEmployer = await prisma.$transaction(async (tx) => {
            const data: any = {
                companyName: String(companyName),
                taxId: String(taxId),
                responsiblePerson: responsiblePerson ? String(responsiblePerson) : undefined,
                phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
                address: address ? String(address) : undefined,
                email: email ? String(email) : undefined,
            };

            if (isCorporate) {
                data.corporateInfo = {
                    create: {
                        factoryRegistrationNo,
                        industryType,
                        laborInsuranceNo,
                        healthInsuranceUnitNo,
                        faxNumber, // Assuming fax is corporate
                    }
                };
            } else if (isIndividual) {
                data.individualInfo = {
                    create: {
                        responsiblePersonIdNo,
                        responsiblePersonSpouse,
                        responsiblePersonFather,
                        responsiblePersonMother,
                        responsiblePersonDob: responsiblePersonDob ? new Date(responsiblePersonDob) : undefined,
                    }
                };
            }

            const emp = await tx.employer.create({
                data
            });

            return emp;
        });

        res.status(201).json(newEmployer);
    } catch (error) {
        console.error('Create Employer Error:', error);
        res.status(500).json({ error: 'Failed to create employer' });
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
        const employer = await prisma.employer.findUnique({
            where: { id },
            include: {
                corporateInfo: true,
                individualInfo: true,
                recruitmentLetters: {
                    orderBy: { issueDate: 'desc' },
                    include: {
                        deployments: true // Used to be entryPermits, but user schema shows deployments relation
                    }
                },
                _count: {
                    select: {
                        deployments: { where: { status: 'active' } }
                    }
                }
            }
        });

        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        res.json(employer);
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
