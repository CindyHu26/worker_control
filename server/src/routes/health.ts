
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// PUT /api/health-checks/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        const updated = await prisma.healthCheck.update({
            where: { id },
            data: {
                approvalDate: body.approvalDate ? new Date(body.approvalDate) : undefined,
                approvalDocNo: body.approvalDocNo,
                isRecheckRequired: body.isRecheckRequired,
                recheckDate: body.recheckDate ? new Date(body.recheckDate) : undefined,
                recheckResult: body.recheckResult,
                treatmentHospital: body.treatmentHospital,
                // Allow updating basic fields too if valid
                reportDate: body.reportDate ? new Date(body.reportDate) : undefined,
                result: body.result,
            }
        });
        res.json(updated);
    } catch (error: any) {
        console.error('Update Health Check Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
