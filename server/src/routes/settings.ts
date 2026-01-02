
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

// Get Single Agency Company
router.get(['/agency-companies/:id', '/agencies/:id'], async (req, res) => {
    try {
        const { id } = req.params;
        const company = await prisma.agencyCompany.findUnique({
            where: { id }
        });

        if (!company) {
            return res.status(404).json({ error: 'Agency company not found' });
        }

        res.json(company);
    } catch (error) {
        console.error('Error fetching agency company:', error);
        res.status(500).json({ error: 'Failed to fetch agency company' });
    }
});

// Create Agency Company
router.post('/agency-companies', async (req, res) => {
    try {
        const {
            name, licenseNo, taxId, responsiblePerson, address, phone, fax, email, isDefault,
            // Address Fields
            city, district, addressDetail, zipCode, fullAddress,
            // New Fields that might be in schema or will be ignored if not
            bankName, bankCode, bankBranch, bankAccountNo, bankAccountName,
            sealLargeUrl, sealSmallUrl, logoUrl,
            agencyCode, licenseExpiryDate,
            // Bilingual
            nameEn, addressEn, representativeEn
        } = req.body;

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
                // Address Mapping
                city,
                district,
                addressDetail,
                zipCode,
                fullAddress: fullAddress || address,
                fullAddressEn: addressEn, // Map addressEn to fullAddressEn

                phone,
                fax,
                email,
                // New Fields - NOT IN SCHEMA (Keep commented or handle if schema updated)
                // bankName, bankCode, bankBranch, bankAccountNo, bankAccountName,
                // sealLargeUrl, sealSmallUrl, logoUrl,
                // agencyCode,
                // licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,

                isDefault: !!isDefault
            } as any
        });

        res.status(201).json(company);
    } catch (error: any) {
        console.error('Error creating agency company:', error);
        res.status(500).json({ error: 'Failed to create agency company', details: error.message || String(error) });
    }
});

// Update Agency Company (Mainly for Set Default)
router.put('/agency-companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            isDefault, licenseExpiryDate,
            city, district, addressDetail, zipCode, fullAddress, address, addressEn,
            ...otherData
        } = req.body;

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
                city,
                district,
                addressDetail,
                zipCode,
                fullAddress: fullAddress || address,
                fullAddressEn: addressEn,

                // licenseExpiryDate: licenseExpiryDate ? new Date(licenseExpiryDate) : null,
                isDefault,
                // Bilingual
                // nameEn: otherData.nameEn,
                // representativeEn: otherData.representativeEn
            } as any
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
            } as any
        });

        res.status(201).json(agency);
    } catch (error) {
        console.error('Error creating foreign agency:', error);
        res.status(500).json({ error: 'Failed to create foreign agency' });
    }
});

export default router;
