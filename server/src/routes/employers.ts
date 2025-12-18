
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

// GET /api/employers
router.get('/', async (req, res) => {
    try {
        const { q, page = '1', limit = '10', category } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};
        if (category) {
            whereClause.category = category;
        }

        if (q) {
            const keyword = q as string;
            whereClause.OR = [
                { companyName: { contains: keyword } },
                { taxId: { contains: keyword } },
                { responsiblePerson: { contains: keyword } }
            ];
        }

        const [total, employers] = await Promise.all([
            prisma.employer.count({ where: whereClause }),
            prisma.employer.findMany({
                where: whereClause,
                include: {
                    institutionInfo: true,
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
            faxNumber,
            // Bilingual
            companyNameEn,
            addressEn,
            responsiblePersonEn,
            // Polymorphic fields
            category,
            // Manufacturing
            factoryRegistrationNo,
            industryType,
            factoryAddressEn,
            // Home Care
            patientName,
            patientIdNo,
            careAddress,
            relationship,
            hospitalCertNo,
            // Institution
            institutionCode,
            bedCount
        } = req.body;

        if (!companyName || !taxId) {
            return res.status(400).json({ error: 'Company name and Tax ID are required' });
        }

        // Check uniqueness
        const existing = await prisma.employer.findUnique({
            where: { taxId }
        });

        if (existing) {
            return res.status(400).json({ error: 'Tax ID already exists' });
        }

        // Prepare industryAttributes
        let jsonString = null;
        let cat = (category && typeof category === 'string') ? category : 'MANUFACTURING';

        if (cat === 'MANUFACTURING') {
            const attrs = {
                factoryRegistrationNo,
                industryType,
                factoryAddressEn,
                factoryAddress: address // fallback or specific
            };
            const parsed = FactoryAttrs.safeParse(attrs);
            if (parsed.success) {
                jsonString = JSON.stringify(parsed.data);
            } else {
                jsonString = JSON.stringify(attrs);
            }
        } else if (cat === 'HOME_CARE' || cat === 'CARETAKER') {
            const attrs = {
                patientName,
                hospitalCertNo: hospitalCertNo || 'N/A',
                careAddress,
                relationship,
                patientIdNo
            };
            jsonString = JSON.stringify(attrs);
        }

        // Transactional Create
        const newEmployer = await prisma.$transaction(async (tx) => {
            const emp = await tx.employer.create({
                data: {
                    companyName: String(companyName),
                    taxId: String(taxId),
                    responsiblePerson: responsiblePerson ? String(responsiblePerson) : undefined,
                    phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
                    address: address ? String(address) : undefined,
                    faxNumber: faxNumber ? String(faxNumber) : undefined,
                    // Bilingual
                    companyNameEn,
                    addressEn,
                    responsiblePersonEn,
                    category: cat,
                    industryAttributes: jsonString
                }
            });

            if (cat === 'INSTITUTION') {
                await tx.institutionInfo.create({
                    data: {
                        employerId: emp.id,
                        institutionCode,
                        bedCount: bedCount ? Number(bedCount) : undefined
                    }
                });
            }

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

        const newLetter = await prisma.recruitmentLetter.create({
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
        await prisma.recruitmentLetter.delete({
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
                institutionInfo: true,
                recruitmentLetters: {
                    orderBy: { issueDate: 'desc' },
                    include: {
                        entryPermits: true // if needed for usedQuota calc
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

        // Use the service to handle JSON packing
        const {
            factoryRegistrationNo, industryCode, industryType, factoryAddress, factoryAddressEn,
            patientName, hospitalCertNo, careAddress, relationship,
            ...core
        } = req.body;

        let attributes = req.body.attributes;

        if (!attributes) {
            // Reconstruct attributes from flat fields if legacy frontend
            if (req.body.category === 'MANUFACTURING' || (!req.body.category && factoryRegistrationNo)) {
                attributes = { factoryRegistrationNo, industryCode, industryType, factoryAddress, factoryAddressEn };
            } else if (req.body.category === 'HOME_CARE' || req.body.category === 'CARETAKER') {
                attributes = { patientName, hospitalCertNo, careAddress, relationship };
            }
        }

        const updatePayload = {
            ...core,
            attributes
        };

        const updated = await updateEmployer(id, updatePayload);
        res.json(updated);
    } catch (error) {
        console.error('Update Employer Error:', error);
        res.status(500).json({ error: 'Failed to update employer' });
    }
});

export default router;
