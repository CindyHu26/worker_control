
import { Router } from 'express';
import { renewPassport, updatePassport, renewArc, analyzeWorkerHealth } from '../services/workerService';
import { checkRecruitmentReadiness } from '../services/employerService';
import { analyzeDormHealth } from '../services/complianceService';

const router = Router();

// ==========================================
// Worker Identity Compliance
// ==========================================

// GET /api/compliance/workers/:id/health
router.get('/workers/:id/health', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await analyzeWorkerHealth(id);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/compliance/workers/:id/passports/renew
router.post('/workers/:id/passports/renew', async (req, res) => {
    try {
        const { id } = req.params;
        const { passportNumber, issueDate, expiryDate, issuePlace } = req.body;

        const result = await renewPassport(id, {
            passportNumber,
            issueDate,
            expiryDate,
            issuePlace
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/compliance/workers/passports/:passportId
router.put('/workers/passports/:passportId', async (req, res) => {
    try {
        const { passportId } = req.params;
        const updateData = req.body; // passportNumber, issueDate, etc.

        const result = await updatePassport(passportId, updateData);

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// Employer Recruitment Readiness
// ==========================================

// GET /api/compliance/employers/:id/readiness
router.get('/employers/:id/readiness', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await checkRecruitmentReadiness(id);
        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// Dormitory Health
router.get('/dormitories/:id/health', async (req, res) => {
    try {
        const result = await analyzeDormHealth(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Health analysis failed' });
    }
});

export default router;
