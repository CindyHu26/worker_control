import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


const router = Router();

/**
 * GET /api/reference/employer-categories
 * Returns all active employer categories
 */
router.get('/employer-categories', async (req, res) => {
    try {
        const categories = await prisma.applicationCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(categories);
    } catch (error: any) {
        console.error('Error fetching employer categories:', error);
        res.status(500).json({ error: 'Failed to fetch employer categories' });
    }
});

/**
 * GET /api/reference/application-types
 * Returns all active application categories (as application types for backward compatibility)
 */
router.get('/application-types', async (req, res) => {
    try {
        const types = await prisma.applicationCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(types);
    } catch (error: any) {
        console.error('Error fetching application types:', error);
        res.status(500).json({ error: 'Failed to fetch application types' });
    }
});

/**
 * GET /api/reference/industry-codes
 * Returns all active industry codes
 */
router.get('/industry-codes', async (req, res) => {
    try {
        const codes = await prisma.industry.findMany({
            where: { isOpen: true },
            orderBy: { code: 'asc' }
        });
        res.json(codes);
    } catch (error: any) {
        console.error('Error fetching industry codes:', error);
        res.status(500).json({ error: 'Failed to fetch industry codes' });
    }
});

/**
 * GET /api/reference/domestic-agencies
 * Returns all active domestic agencies (basic info for dropdown)
 */
router.get('/domestic-agencies', async (req, res) => {
    try {
        const agencies = await prisma.domesticAgency.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                agencyNameZh: true,
                agencyNameEn: true,
                agencyNameShort: true,
                phone: true,
                email: true,
                sortOrder: true,
                isActive: true
            },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(agencies);
    } catch (error: any) {
        console.error('Error fetching domestic agencies:', error);
        res.status(500).json({ error: 'Failed to fetch domestic agencies' });
    }
});

/**
 * GET /api/reference/domestic-agencies/:id
 * Returns complete agency information including bilateral trade licenses
 */
router.get('/domestic-agencies/:id', async (req, res) => {
    try {
        const agency = await prisma.domesticAgency.findUnique({
            where: { id: req.params.id },
            include: {
                bilateralTradeLicenses: {
                    where: { status: 'ACTIVE' },
                    orderBy: { validTo: 'desc' }
                }
            }
        });
        if (!agency) {
            return res.status(404).json({ error: 'Agency not found' });
        }
        res.json(agency);
    } catch (error: any) {
        console.error('Error fetching agency details:', error);
        res.status(500).json({ error: 'Failed to fetch agency details' });
    }
});

/**
 * GET /api/reference/partner-agencies
 * Returns all active partner agencies (basic info for dropdown)
 */
router.get('/partner-agencies', async (req, res) => {
    try {
        const agencies = await prisma.partnerAgency.findMany({
            where: { isActive: true },
            select: {
                id: true,
                code: true,
                agencyNameZh: true,
                agencyNameZhShort: true,
                agencyNameEn: true,
                agencyNameEnShort: true,
                country: true,
                countryNameZh: true,
                isActive: true
            },
            orderBy: { code: 'asc' }
        });
        res.json(agencies);
    } catch (error: any) {
        console.error('Error fetching partner agencies:', error);
        res.status(500).json({ error: 'Failed to fetch partner agencies' });
    }
});

/**
 * GET /api/reference/loan-banks
 * Returns all active loan banks
 */
router.get('/loan-banks', async (req, res) => {
    try {
        const banks = await prisma.loanBank.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(banks);
    } catch (error: any) {
        console.error('Error fetching loan banks:', error);
        res.status(500).json({ error: 'Failed to fetch loan banks' });
    }
});

/**
 * GET /api/reference/banks
 * Returns all active banks
 */
router.get('/banks', async (req, res) => {
    try {
        const banks = await prisma.bank.findMany({
            where: { isActive: true },
            orderBy: { bankName: 'asc' }
        });
        res.json(banks);
    } catch (error: any) {
        console.error('Error fetching banks:', error);
        res.status(500).json({ error: 'Failed to fetch banks' });
    }
});

/**
 * GET /api/reference/departments
 * Returns all active departments
 */
router.get('/departments', async (req, res) => {
    try {
        const departments = await prisma.department.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(departments);
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// ==========================================
// Generic Reference Data CRUD (for Master Data Management)
// ==========================================

/**
 * GET /api/reference/categories
 * Returns distinct categories from ReferenceData
 */
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma.referenceData.findMany({
            select: { category: true },
            distinct: ['category'],
            orderBy: { category: 'asc' }
        });
        res.json(categories.map(c => c.category));
    } catch (error: any) {
        console.error('Error fetching reference categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

/**
 * GET /api/reference/items/:category
 * Returns all items for a specific category
 */
router.get('/items/:category', async (req, res) => {
    try {
        const items = await prisma.referenceData.findMany({
            where: {
                category: req.params.category,
                isActive: true
            },
            orderBy: { sortOrder: 'asc' }
        });
        res.json(items);
    } catch (error: any) {
        console.error('Error fetching reference items:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

/**
 * POST /api/reference/items/:category
 * Create new reference data item
 */
router.post('/items/:category', async (req, res) => {
    try {
        const { code, label, labelEn, sortOrder, metadata } = req.body;

        if (!code || !label) {
            return res.status(400).json({ error: 'Code and label are required' });
        }

        const item = await prisma.referenceData.create({
            data: {
                category: req.params.category,
                code,
                label,
                labelEn,
                sortOrder: sortOrder || 0,
                metadata,
                isSystem: false
            }
        });
        res.status(201).json(item);
    } catch (error: any) {
        console.error('Error creating reference item:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Code already exists in this category' });
        }
        res.status(500).json({ error: 'Failed to create item' });
    }
});

/**
 * PUT /api/reference/items/:category/:code
 * Update reference data item
 */
router.put('/items/:category/:code', async (req, res) => {
    try {
        const { label, labelEn, sortOrder, isActive, metadata } = req.body;

        const existing = await prisma.referenceData.findUnique({
            where: { category_code: { category: req.params.category, code: req.params.code } }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = await prisma.referenceData.update({
            where: { category_code: { category: req.params.category, code: req.params.code } },
            data: { label, labelEn, sortOrder, isActive, metadata }
        });
        res.json(item);
    } catch (error: any) {
        console.error('Error updating reference item:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

/**
 * DELETE /api/reference/items/:category/:code
 * Delete reference data item (blocked if isSystem)
 */
router.delete('/items/:category/:code', async (req, res) => {
    try {
        const existing = await prisma.referenceData.findUnique({
            where: { category_code: { category: req.params.category, code: req.params.code } }
        });

        if (!existing) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (existing.isSystem) {
            return res.status(403).json({ error: 'Cannot delete system items' });
        }

        await prisma.referenceData.delete({
            where: { category_code: { category: req.params.category, code: req.params.code } }
        });
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting reference item:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

export default router;
