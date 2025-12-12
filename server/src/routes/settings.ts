
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// =========================================
// Agency Company (Internal)
// =========================================

// List Agency Companies
router.get('/agency-companies', async (req, res) => {
    try {
        const companies = await prisma.agencyCompany.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(companies);
    } catch (error) {
        console.error('Error fetching agency companies:', error);
        res.status(500).json({ error: 'Failed to fetch agency companies' });
    }
});

// Create Agency Company
router.post('/agency-companies', async (req, res) => {
    try {
        const { name, licenseNo, taxId, responsiblePerson, address, phone, fax, email, isDefault } = req.body;

        if (isDefault) {
            // Unset other defaults if this one is set to default
            await prisma.agencyCompany.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        const company = await prisma.agencyCompany.create({
            data: {
                name,
                licenseNo,
                taxId,
                responsiblePerson,
                address,
                phone,
                fax,
                email,
                isDefault: !!isDefault
            }
        });

        res.status(201).json(company);
    } catch (error) {
        console.error('Error creating agency company:', error);
        res.status(500).json({ error: 'Failed to create agency company' });
    }
});

// Update Agency Company (Mainly for Set Default)
router.put('/agency-companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { isDefault, ...otherData } = req.body;

        if (isDefault) {
            // Unset other defaults
            await prisma.agencyCompany.updateMany({
                where: { isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        const company = await prisma.agencyCompany.update({
            where: { id },
            data: {
                ...otherData,
                isDefault
            }
        });

        res.json(company);
    } catch (error) {
        console.error('Error updating agency company:', error);
        res.status(500).json({ error: 'Failed to update agency company' });
    }
});

// =========================================
// Foreign Agency (Partners)
// =========================================

// List Foreign Agencies
router.get('/foreign-agencies', async (req, res) => {
    try {
        const agencies = await prisma.foreignAgency.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(agencies);
    } catch (error) {
        console.error('Error fetching foreign agencies:', error);
        res.status(500).json({ error: 'Failed to fetch foreign agencies' });
    }
});

// Create Foreign Agency
router.post('/foreign-agencies', async (req, res) => {
    try {
        const { name, chineseName, country, code, contactPerson, email, phone } = req.body;

        const agency = await prisma.foreignAgency.create({
            data: {
                name,
                chineseName,
                country,
                code,
                contactPerson,
                email,
                phone
            }
        });

        res.status(201).json(agency);
    } catch (error) {
        console.error('Error creating foreign agency:', error);
        res.status(500).json({ error: 'Failed to create foreign agency' });
    }
});

export default router;
