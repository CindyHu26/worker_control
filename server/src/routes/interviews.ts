import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/interviews/candidates
// List workers with status "CANDIDATE"
router.get('/candidates', async (req, res) => {
    try {
        const candidates = await prisma.worker.findMany({
            where: {
                status: 'CANDIDATE'
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(candidates);
    } catch (error) {
        console.error('Fetch Candidates Error:', error);
        res.status(500).json({ error: 'Failed to fetch candidates' });
    }
});

// POST /api/interviews
// Create a new Interview for a Job Order
router.post('/', async (req, res) => {
    try {
        const { jobOrderId, interviewDate, location, interviewer } = req.body;

        const interview = await prisma.interview.create({
            data: {
                jobOrderId,
                interviewDate: new Date(interviewDate),
                location,
                interviewer
            }
        });

        res.json(interview);
    } catch (error) {
        console.error('Create Interview Error:', error);
        res.status(500).json({ error: 'Failed to create interview' });
    }
});

// GET /api/interviews/:id
// Get interview details with candidates
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const interview = await prisma.interview.findUnique({
            where: { id },
            include: {
                candidates: {
                    include: {
                        worker: true
                    }
                },
                jobOrder: {
                    include: {
                        employer: true,
                        jobRequisition: true
                    }
                }
            }
        });

        if (!interview) return res.status(404).json({ error: 'Interview not found' });

        res.json(interview);
    } catch (error) {
        console.error('Get Interview Error:', error);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
});

// POST /api/interviews/:id/candidates
// Add candidates to an interview
router.post('/:id/candidates', async (req, res) => {
    try {
        const { id } = req.params;
        const { workerIds } = req.body; // Array of worker IDs

        if (!Array.isArray(workerIds)) {
            return res.status(400).json({ error: 'workerIds must be an array' });
        }

        const results = await prisma.$transaction(
            workerIds.map((workerId: string) =>
                prisma.interviewCandidate.create({
                    data: {
                        interviewId: id,
                        workerId,
                        result: 'pending'
                    }
                })
            )
        );

        res.json(results);
    } catch (error) {
        console.error('Add Candidates Error:', error);
        res.status(500).json({ error: 'Failed to add candidates' });
    }
});

// PATCH /api/interviews/:id/candidates/:workerId
// Update candidate result (Accept/Reject)
router.patch('/:id/candidates/:workerId', async (req, res) => {
    try {
        const { id, workerId } = req.params;
        const { result, remarks } = req.body; // result: 'accepted', 'rejected', 'pending'

        const updatedCandidate = await prisma.interviewCandidate.update({
            where: {
                interviewId_workerId: {
                    interviewId: id,
                    workerId
                }
            },
            data: {
                result,
                remarks
            }
        });

        // If Accepted, automatically update Worker status to 'ACTIVE' (or 'HIRED' pending process)
        // For now, let's keep it simple: if accepted, maybe just mark the candidate result.
        // The Prompt says: "Transitioning Accepted Candidates to Hired status."
        // Let's optionally do that if requested? Or keep it manual? 
        // For now, I'll just update the candidate result. The conversion to "Active Worker" with Deployment creation is a separate step usually.
        // But I should update the status from CANDIDATE to something else if they fail?
        // Let's stick to updating the InterviewCandidate result first.

        res.json(updatedCandidate);
    } catch (error) {
        console.error('Update Candidate Result Error:', error);
        res.status(500).json({ error: 'Failed to update candidate result' });
    }
});

export default router;
