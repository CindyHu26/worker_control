import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const router = Router();

// Schema
const RecruitmentProofSchema = z.object({
    employerId: z.string().uuid(),
    receiptNumber: z.string().min(1),
    registerDate: z.string().transform(str => new Date(str)),
    issueDate: z.string().transform(str => new Date(str)),
    jobCenter: z.string().optional(),
    status: z.enum(['VALID', 'EXPIRED', 'USED']).optional().default('VALID'),
    reviewFeeReceiptNo: z.string().optional(),
    reviewFeePayDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
});

// GET all for employer
router.get('/', async (req, res) => {
    const { employerId, valid } = req.query;
    if (!employerId || typeof employerId !== 'string') {
        return res.status(400).json({ error: 'employerId is required' });
    }

    try {
        const where: any = { employerId };

        if (valid === 'true') {
            where.status = 'VALID';
        }

        const records = await prisma.recruitmentProof.findMany({
            where,
            orderBy: { issueDate: 'desc' },
            include: {
                recruitmentLetters: {
                    select: { id: true, letterNumber: true }
                }
            }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch' });
    }
});

// CREATE
router.post('/', async (req, res) => {
    try {
        const data = RecruitmentProofSchema.parse(req.body);

        // Check duplicate
        const existing = await prisma.recruitmentProof.findUnique({
            where: { receiptNumber: data.receiptNumber }
        });
        if (existing) {
            return res.status(400).json({ error: 'Receipt number exists' });
        }

        const newRecord = await prisma.recruitmentProof.create({
            data: {
                employerId: data.employerId,
                receiptNumber: data.receiptNumber,
                registerDate: data.registerDate,
                issueDate: data.issueDate,
                jobCenter: data.jobCenter,
                status: data.status,
                reviewFeeReceiptNo: data.reviewFeeReceiptNo,
                reviewFeePayDate: data.reviewFeePayDate,
            }
        });
        res.json(newRecord);
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: 'Invalid data' });
    }
});

// UPDATE
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const data = RecruitmentProofSchema.partial().parse(req.body);
        const updated = await prisma.recruitmentProof.update({
            where: { id },
            data
        });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Update failed' });
    }
});

// DELETE
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.recruitmentProof.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed' });
    }
});

export default router;
