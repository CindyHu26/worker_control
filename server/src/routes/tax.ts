
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

import { getTaiwanToday, parseTaiwanDate } from '../utils/dateUtils';
import { addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/tax/worker/:id/records
// Get raw payroll records for list view
router.get('/worker/:id/records', async (req, res) => {
    const { id } = req.params;
    try {
        const records = await prisma.payrollRecord.findMany({
            where: { workerId: id },
            orderBy: { payDate: 'desc' }
        });
        res.json(records);
    } catch (error: any) {
        console.error('Fetch Payroll Records Error:', error);
        res.status(500).json({ error: 'Failed to fetch payroll records' });
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
        // Parse dates using timezone-safe utility
        const parsedPayDate = parseTaiwanDate(payDate);

        // Infer work period if not provided (default to previous month)
        let periodStart: Date;
        let periodEnd: Date;

        if (workPeriodStart && workPeriodEnd) {
            periodStart = parseTaiwanDate(workPeriodStart);
            periodEnd = parseTaiwanDate(workPeriodEnd);
        } else {
            // Default: Pay date is usually in month M for work done in M-1
            // e.g. Pay Jan 5 for Dec 1-31
            const paymentMonth = parsedPayDate;
            const prevMonth = subMonths(paymentMonth, 1);
            periodStart = startOfMonth(prevMonth);
            periodEnd = endOfMonth(prevMonth);
        }

        // Calculate implied tax rate used for reference
        const totalIncome = Number(salaryAmount) + Number(bonusAmount || 0);
        const withheld = Number(taxWithheld || 0);
        const taxRateUsed = totalIncome > 0 ? (withheld / totalIncome) : 0;

        const record = await prisma.payrollRecord.create({
            data: {
                workerId,
                employerId, // Should be fetched from deployment if not passed? For now assum passed.
                payDate: parsedPayDate,
                workPeriodStart: periodStart,
                workPeriodEnd: periodEnd,
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
