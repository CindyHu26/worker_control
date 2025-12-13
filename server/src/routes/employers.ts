
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

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
            // Add HomeCare specific search later if needed (e.g. Patient Name)
        }

        const [total, employers] = await Promise.all([
            prisma.employer.count({ where: whereClause }),
            prisma.employer.findMany({
                where: whereClause,
                include: {
                    factoryInfo: true,
                    homeCareInfo: { include: { patients: true } },
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
            // Polymorphic fields
            category,
            // Manufacturing
            factoryRegistrationNo,
            industryType,
            // Home Care
            patientName,
            patientIdNo,
            careAddress,
            relationship,
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

        // Transactional Create
        const newEmployer = await prisma.$transaction(async (tx) => {
            const emp = await tx.employer.create({
                data: {
                    companyName,
                    taxId,
                    responsiblePerson,
                    phoneNumber,
                    address,
                    faxNumber,
                    category: category || 'MANUFACTURING'
                }
            });

            if (category === 'MANUFACTURING') {
                await tx.factoryInfo.create({
                    data: {
                        employerId: emp.id,
                        factoryRegistrationNo,
                        industryType
                    }
                });
            } else if (category === 'HOME_CARE') {
                const hc = await tx.homeCareInfo.create({
                    data: {
                        employerId: emp.id,
                    }
                });
                if (patientName) {
                    await tx.patient.create({
                        data: {
                            homeCareInfoId: hc.id,
                            name: patientName,
                            idNo: patientIdNo,
                            careAddress,
                            relationship
                        }
                    });
                }
            } else if (category === 'INSTITUTION') {
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

export default router;
