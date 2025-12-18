
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/immigration/:workerId
router.get('/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;
        const process = await prisma.immigrationProcess.findUnique({
            where: { workerId },
            include: {
                healthCheckHospital: true
            }
        });

        // If not found, return null or empty object? Or creating one on the fly?
        // Usually frontend handles "no data yet".
        res.json(process || null);
    } catch (error) {
        console.error('Get Immigration Process Error:', error);
        res.status(500).json({ error: 'Failed to fetch immigration info' });
    }
});

// PUT /api/immigration/:workerId
router.put('/:workerId', async (req, res) => {
    try {
        const { workerId } = req.params;
        const data = req.body;

        // Ensure user exists
        const worker = await prisma.worker.findUnique({ where: { id: workerId } });
        if (!worker) return res.status(404).json({ error: 'Worker not found' });

        const process = await prisma.immigrationProcess.upsert({
            where: { workerId },
            update: {
                // Tracking Fields
                healthCheckHospitalId: data.healthCheckHospitalId || null,
                healthCheckDate: data.healthCheckDate ? new Date(data.healthCheckDate) : null,
                healthCheckStatus: data.healthCheckStatus,

                policeCode: data.policeCode,
                policeDate: data.policeDate ? new Date(data.policeDate) : null,

                passportNo: data.passportNo,
                passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : null,
                passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate) : null,
                passportSubmissionDate: data.passportSubmissionDate ? new Date(data.passportSubmissionDate) : null,

                biometricDate: data.biometricDate ? new Date(data.biometricDate) : null,
                trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
                trainingCity: data.trainingCity,

                estimatedEntryDate: data.estimatedEntryDate ? new Date(data.estimatedEntryDate) : null,
                actualEntryDate: data.actualEntryDate ? new Date(data.actualEntryDate) : null,

                status: (data.actualEntryDate) ? 'COMPLETED' : 'PENDING'
            },
            create: {
                workerId,
                // Repeat fields provided in Data
                healthCheckHospitalId: data.healthCheckHospitalId || null,
                healthCheckDate: data.healthCheckDate ? new Date(data.healthCheckDate) : null,
                healthCheckStatus: data.healthCheckStatus,

                policeCode: data.policeCode,
                policeDate: data.policeDate ? new Date(data.policeDate) : null,

                passportNo: data.passportNo,
                passportIssueDate: data.passportIssueDate ? new Date(data.passportIssueDate) : null,
                passportExpiryDate: data.passportExpiryDate ? new Date(data.passportExpiryDate) : null,
                passportSubmissionDate: data.passportSubmissionDate ? new Date(data.passportSubmissionDate) : null,

                biometricDate: data.biometricDate ? new Date(data.biometricDate) : null,
                trainingDate: data.trainingDate ? new Date(data.trainingDate) : null,
                trainingCity: data.trainingCity,

                estimatedEntryDate: data.estimatedEntryDate ? new Date(data.estimatedEntryDate) : null,
                actualEntryDate: data.actualEntryDate ? new Date(data.actualEntryDate) : null,

                status: (data.actualEntryDate) ? 'COMPLETED' : 'PENDING'
            }
        });

        res.json(process);
    } catch (error) {
        console.error('Update Immigration Process Error:', error);
        res.status(500).json({ error: 'Failed to update immigration info' });
    }
});

export default router;
