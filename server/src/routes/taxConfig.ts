import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/tax-config - List all tax configurations
router.get('/', async (req, res) => {
    try {
        const configs = await prisma.taxConfig.findMany({
            orderBy: { year: 'desc' }
        });
        res.json(configs);
    } catch (error) {
        console.error('Tax Config List Error:', error);
        res.status(500).json({ error: 'Failed to fetch tax configurations' });
    }
});

// GET /api/tax-config/:year - Get config for specific year
router.get('/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const config = await prisma.taxConfig.findUnique({
            where: { year }
        });

        if (!config) {
            return res.status(404).json({ error: 'Tax configuration not found for this year' });
        }

        res.json(config);
    } catch (error) {
        console.error('Tax Config Get Error:', error);
        res.status(500).json({ error: 'Failed to fetch tax configuration' });
    }
});

// POST /api/tax-config - Create new tax configuration
router.post('/', async (req, res) => {
    try {
        const config = await prisma.taxConfig.create({
            data: {
                year: req.body.year,
                minWage: req.body.minWage,
                minWageThresholdMultiplier: req.body.minWageThresholdMultiplier || 1.5,
                standardDeduction: req.body.standardDeduction,
                salaryDeduction: req.body.salaryDeduction,
                personalExemption: req.body.personalExemption,
                taxRateResident: req.body.taxRateResident,
                nonResidentLowRate: req.body.nonResidentLowRate,
                nonResidentHighRate: req.body.nonResidentHighRate,
                effectiveDate: new Date(req.body.effectiveDate),
                notes: req.body.notes
            }
        });

        res.status(201).json(config);
    } catch (error) {
        console.error('Tax Config Create Error:', error);
        res.status(500).json({ error: 'Failed to create tax configuration' });
    }
});

// PUT /api/tax-config/:year - Update existing configuration
router.put('/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const config = await prisma.taxConfig.update({
            where: { year },
            data: {
                minWage: req.body.minWage,
                minWageThresholdMultiplier: req.body.minWageThresholdMultiplier,
                standardDeduction: req.body.standardDeduction,
                salaryDeduction: req.body.salaryDeduction,
                personalExemption: req.body.personalExemption,
                taxRateResident: req.body.taxRateResident,
                nonResidentLowRate: req.body.nonResidentLowRate,
                nonResidentHighRate: req.body.nonResidentHighRate,
                effectiveDate: new Date(req.body.effectiveDate),
                notes: req.body.notes
            }
        });

        res.json(config);
    } catch (error) {
        console.error('Tax Config Update Error:', error);
        res.status(500).json({ error: 'Failed to update tax configuration' });
    }
});

// DELETE /api/tax-config/:year - Delete configuration (use with caution)
router.delete('/:year', async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        await prisma.taxConfig.delete({
            where: { year }
        });

        res.json({ message: 'Tax configuration deleted successfully' });
    } catch (error) {
        console.error('Tax Config Delete Error:', error);
        res.status(500).json({ error: 'Failed to delete tax configuration' });
    }
});

export default router;
