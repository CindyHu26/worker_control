
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/employers
router.get('/', async (req, res) => {
    try {
        const { q, page = '1', limit = '10' } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        const whereClause: any = {};

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

// Get Employer Details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const employer = await prisma.employer.findUnique({
            where: { id },
            include: {
                recruitmentLetters: {
                    orderBy: {
                        issueDate: 'desc'
                    }
                },
                _count: {
                    select: {
                        deployments: true
                    }
                }
            }
        });

        if (!employer) {
            return res.status(404).json({ error: 'Employer not found' });
        }

        res.json(employer);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch employer details' });
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
            address
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

        const newEmployer = await prisma.employer.create({
            data: {
                companyName,
                taxId,
                responsiblePerson,
                phoneNumber,
                address
            }
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
