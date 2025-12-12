
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

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
                        workers: true,
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
