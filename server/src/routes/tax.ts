
import { Router } from 'express';
import prisma from '../prisma';
import { calculateTaxLiability } from '../services/taxService';

const router = Router();

// GET /api/tax/worker/:id/summary
// Get tax summary for a worker in a specific year
router.get('/worker/:id/summary', async (req, res) => {
    const { id } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();

    try {
        const result = await calculateTaxLiability(id, year);
        res.json(result); // Returns stats, residency, refund estimate
    } catch (error: any) {
        console.error('Tax Summary Error:', error);
        res.status(500).json({ error: 'Failed to calculate tax summary' });
    }
});

// POST /api/tax/payroll
// Create or Update a Payroll Record
router.post('/payroll', async (req, res) => {
    const {
        workerId,
        employerId,
        payDate,
        workPeriodStart,
        workPeriodEnd,
        salaryAmount,
        bonusAmount,
        taxWithheld
    } = req.body;

    if (!workerId || !payDate || !salaryAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Calculate implied tax rate used for reference
        const totalIncome = Number(salaryAmount) + Number(bonusAmount || 0);
        const withheld = Number(taxWithheld || 0);
        const taxRateUsed = totalIncome > 0 ? (withheld / totalIncome) : 0;

        const record = await prisma.payrollRecord.create({
            data: {
                workerId,
                employerId,
                payDate: new Date(payDate),
                workPeriodStart: new Date(workPeriodStart),
                workPeriodEnd: new Date(workPeriodEnd),
                salaryAmount: Number(salaryAmount),
                bonusAmount: Number(bonusAmount || 0),
                taxWithheld: withheld,
                taxRateUsed,
                filingStatus: 'PENDING'
            }
        });

        res.json(record);
    } catch (error: any) {
        console.error('Create Payroll Error:', error);
        res.status(500).json({ error: 'Failed to create payroll record' });
    }
});

export default router;
