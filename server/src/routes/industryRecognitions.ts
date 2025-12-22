import { Router } from 'express';
import prisma from '../prisma';
import { z } from 'zod';

const router = Router();

// Schema for creating IndustryRecognition
const IndustryRecognitionSchema = z.object({
  employerId: z.string().uuid(),
  factoryId: z.string().uuid().optional(),
  bureauRefNumber: z.string().min(1),
  issueDate: z.string().transform(str => new Date(str)),
  tier: z.enum(['A+', 'A', 'B', 'C', 'D']),
  expiryDate: z.string().transform(str => new Date(str)).optional(),
  fileUrl: z.string().optional(),
  approvedQuota: z.number().int().min(0).optional(),
  allocationRate: z.number().optional(), // Expect decimal value e.g. 0.2
});

// GET all for an employer
router.get('/', async (req, res) => {
  const { employerId } = req.query;
  if (!employerId || typeof employerId !== 'string') {
    return res.status(400).json({ error: 'employerId is required' });
  }

  try {
    const records = await prisma.industryRecognition.findMany({
      where: { employerId },
      orderBy: { issueDate: 'desc' },
      include: {
        recruitmentLetters: {
          select: { id: true, letterNumber: true }
        }
      }
    });
    res.json(records);
  } catch (error) {
    console.error('Error fetching industry recognitions:', error);
    res.status(500).json({ error: 'Failed to fetch' });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const data = IndustryRecognitionSchema.parse(req.body);

    // Check for duplicate bureauRefNumber
    const existing = await prisma.industryRecognition.findUnique({
      where: { bureauRefNumber: data.bureauRefNumber }
    });

    if (existing) {
      return res.status(400).json({ error: 'Ref number already exists' });
    }

    const newRecord = await prisma.industryRecognition.create({
      data: {
        employerId: data.employerId,
        factoryId: data.factoryId,
        bureauRefNumber: data.bureauRefNumber,
        issueDate: data.issueDate,
        tier: data.tier,
        expiryDate: data.expiryDate,
        fileUrl: data.fileUrl,
        approvedQuota: data.approvedQuota || 0,
        allocationRate: data.allocationRate,
      }
    });
    res.json(newRecord);
  } catch (error) {
    console.error('Error creating industry recognition:', error);
    res.status(400).json({ error: 'Invalid data', details: error });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // We allow partial updates, but keeping it simple for now
    const data = IndustryRecognitionSchema.partial().parse(req.body);

    const updated = await prisma.industryRecognition.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: 'Update failed', details: error });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.industryRecognition.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

export default router;
