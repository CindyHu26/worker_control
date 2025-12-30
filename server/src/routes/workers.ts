import { Router } from 'express';
import prisma from '../prisma';
import { getWorkerDashboardData } from '../services/workerService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for Worker Photos
// Configure Multer for Worker Photos
import { storageService } from '../services/storageService';
import { parseOptionalDate } from '../utils/dateUtils';
import { parseNumber } from '../utils/numberUtils';
import { searchWorkers, getWorkerById } from '../services/workerQueryService';
import { renewDocument } from '../services/workerDocumentService';

// Configure Multer for MinIO Upload (Memory Storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
    }
});

const router = Router();

// GET /api/workers
router.get('/', async (req, res, next) => {
    try {
        const result = await searchWorkers(req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/workers/:id/dashboard
router.get('/:id/dashboard', async (req, res) => {
    const { id } = req.params;
    try {
        const data = await getWorkerDashboardData(id);
        if (!data) {
            return res.status(404).json({ error: 'Worker not found' });
        }
        res.json(data);
    } catch (error) {
        console.error('Worker Dashboard Error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// POST /api/workers/:id/documents/renew
router.post('/:id/documents/renew', async (req, res, next) => {
    const { id } = req.params;
    const { type, newNumber, issueDate, expiryDate } = req.body;

    try {
        const result = await renewDocument(id, { type, newNumber, issueDate, expiryDate });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// GET /api/workers/:id
router.get('/:id', async (req, res, next) => {
    const { id } = req.params;
    try {
        const worker = await getWorkerById(id);

        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json(worker);
    } catch (error) {
        next(error);
    }
});

// POST /api/workers/check-duplicate
router.post('/check-duplicate', async (req, res) => {
    const { passportNumber, arcNumber, name } = req.body;
    try {
        const filters: any[] = [];
        if (passportNumber) {
            filters.push({ passports: { some: { passportNumber } } });
            filters.push({ oldPassportNumber: passportNumber });
        }
        if (arcNumber) {
            filters.push({ arcs: { some: { arcNumber } } });
        }

        if (filters.length === 0) {
            return res.json({ found: false });
        }

        const existingWorker = await prisma.worker.findFirst({
            where: {
                OR: filters
            },
            include: {
                passports: true,
                deployments: {
                    where: { status: 'active' },
                    include: { employer: true }
                }
            }
        });

        if (existingWorker) {
            return res.json({
                found: true,
                worker: existingWorker,
                message: `Worker exists: ${existingWorker.englishName} ${existingWorker.chineseName || ''}`
            });
        }

        res.json({ found: false });
    } catch (error) {
        console.error('Check Duplicate Error:', error);
        res.status(500).json({ error: 'Failed to check duplicate' });
    }
});

// POST /api/workers/full-entry (Atomic Creation)
router.post('/full-entry', async (req, res) => {
    try {
        const body = req.body;
        // Body includes: bio-data, deployment info

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Worker
            const worker = await tx.worker.create({
                data: {
                    englishName: body.englishName,
                    chineseName: body.chineseName,
                    nationality: body.nationality,
                    dob: parseOptionalDate(body.dob),
                    category: body.category || 'general', // care, manufacturing
                    gender: body.gender,
                    maritalStatus: body.maritalStatus,
                    height: parseNumber(body.height),
                    weight: parseNumber(body.weight),
                    bloodType: body.bloodType,
                    religion: body.religion,
                    educationLevel: body.educationLevel,
                    birthPlace: body.birthPlace,
                    spouseName: body.spouseName,
                    overseasFamilyContact: body.overseasFamilyContact,
                    overseasContactPhone: body.overseasContactPhone,
                    emergencyContactPhone: body.emergencyContactPhone,
                    mobilePhone: body.mobilePhone,
                    lineId: body.lineId,
                    bankAccountNo: body.bankAccountNo,
                    bankCode: body.bankCode,
                } as any
            });

            // 2. Create Passport (Current)
            if (body.passportNumber) {
                await tx.workerPassport.create({
                    data: {
                        workerId: worker.id,
                        passportNumber: body.passportNumber,
                        issueDate: parseOptionalDate(body.passportIssueDate) || new Date(),
                        expiryDate: parseOptionalDate(body.passportExpiryDate) || new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
                        isCurrent: true
                    }
                });
            }

            // 3. Create Deployment if Employer Selected
            if (body.employerId) {
                await tx.deployment.create({
                    data: {
                        workerId: worker.id,
                        employerId: body.employerId,
                        jobType: body.jobType, // NEW field in schema? Wait, Deployment has `jobType`
                        status: 'pending', // Initial status
                        startDate: parseOptionalDate(body.contractStartDate) || new Date(),
                        endDate: parseOptionalDate(body.contractEndDate),
                        sourceType: body.recruitmentSource || 'direct_hiring',
                        serviceStatus: body.serviceStatus || 'incoming',
                        // processStage: 'recruitment', // Removed as it is not in schema
                    }
                });
            }

            return worker;
        });

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Full Entry Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create worker entry' });
    }
});

// POST /api/workers (Legacy - Keep for compatibility or redirect?)
router.post('/', async (req, res) => {
    // ... Legacy implementation kept ...
    try {
        const {
            englishName,
            chineseName,
            nationality,
            dob,
            mobilePhone,
            passportNumber,
            passportIssueDate,
            passportExpiryDate
        } = req.body;

        if (!englishName || !nationality) {
            return res.status(400).json({ error: 'Missing required fields: englishName, nationality' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Worker
            const worker = await tx.worker.create({
                data: {
                    englishName,
                    chineseName,
                    nationality,
                    dob: dob ? new Date(dob) : undefined,
                    mobilePhone,
                    category: 'general' // Default
                } as any
            });

            // 2. Create Passport (Optional)
            if (passportNumber) {
                await tx.workerPassport.create({
                    data: {
                        workerId: worker.id,
                        passportNumber,
                        issueDate: passportIssueDate ? new Date(passportIssueDate) : new Date(),
                        expiryDate: passportExpiryDate ? new Date(passportExpiryDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
                        isCurrent: true
                    }
                });
            }

            return worker;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error('Create Worker Error:', error);
        res.status(500).json({ error: 'Failed to create worker' });
    }
});

// PUT /api/workers/:id
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Update Worker Fields
            const updatedWorker = await tx.worker.update({
                where: { id },
                data: {
                    englishName: body.englishName,
                    chineseName: body.chineseName,
                    nationality: body.nationality,
                    gender: body.gender,
                    dob: body.dob ? new Date(body.dob) : undefined,

                    homeCountryId: body.homeCountryId,
                    taxId: body.taxId,
                    religion: body.religion,
                    bloodType: body.bloodType,
                    height: body.height ? Number(body.height) : undefined,
                    weight: body.weight ? Number(body.weight) : undefined,
                    isTaxResident: body.isTaxResident,

                    mobilePhone: body.mobilePhone,
                    overseasContactPhone: body.overseasContactPhone,
                    overseasFamilyContact: body.overseasFamilyContact,
                    emergencyContactPhone: body.emergencyContactPhone,
                    lineId: body.lineId,
                    foreignCity: body.foreignCity,
                    foreignDistrict: body.foreignDistrict,
                    foreignAddressDetail: body.foreignAddressDetail || body.foreignAddress,
                    foreignZipCode: body.foreignZipCode,
                    foreignFullAddress: body.foreignFullAddress,
                    maritalStatus: body.maritalStatus,
                    spouseName: body.spouseName,
                    educationLevel: body.educationLevel,
                    birthPlace: body.birthPlace,
                    marriageDate: body.marriageDate ? new Date(body.marriageDate) : undefined,
                    divorceDate: body.divorceDate ? new Date(body.divorceDate) : undefined,

                    oldPassportNumber: body.oldPassportNumber,

                    bankCode: body.bankCode,
                    bankAccountNo: body.bankAccountNo,
                    bankBranchName: body.bankBranchName,
                    bankAccountHolder: body.bankAccountHolder,
                    loanBank: body.loanBank,
                    loanAmount: body.loanAmount ? Number(body.loanAmount) : undefined,
                } as any
            });

            // 2. Update Active/Pending Deployment Fields
            const activeDeployment = await tx.deployment.findFirst({
                where: {
                    workerId: id,
                    status: { in: ['active', 'pending'] }
                },
                orderBy: { startDate: 'desc' }
            });

            if (activeDeployment) {
                await tx.deployment.update({
                    where: { id: activeDeployment.id },
                    data: {
                        visaLetterNo: body.visaLetterNo,
                        visaLetterDate: body.visaLetterDate ? new Date(body.visaLetterDate) : undefined,
                        replacementLetterNumber: body.replacementLetterNumber,
                        replacementLetterDate: body.replacementLetterDate ? new Date(body.replacementLetterDate) : undefined,
                        entryDate: body.entryDate ? new Date(body.entryDate) : undefined,
                        entryReportDate: body.entryReportDate ? new Date(body.entryReportDate) : undefined,
                        entryReportDocNo: body.entryReportDocNo,
                        fingerprintDate: body.fingerprintDate ? new Date(body.fingerprintDate) : undefined,

                        runawayReportDate: body.runawayReportDate ? new Date(body.runawayReportDate) : undefined,
                        runawayReportDocNo: body.runawayReportDocNo,
                        terminationPermitDate: body.terminationPermitDate ? new Date(body.terminationPermitDate) : undefined,
                        terminationPermitNo: body.terminationPermitNo,
                        transferPermitDate: body.transferPermitDate ? new Date(body.transferPermitDate) : undefined,
                        transferPermitNo: body.transferPermitNo,
                    }
                });

                // Schema for WorkerTimeline removed.
                if (body.entryDate) {
                    // Timeline auto-calc disabled
                }
            }

            return updatedWorker;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Update Worker Error:', error);
        res.status(500).json({ error: error.message || 'Failed to update worker' });
    }
});

// POST /api/workers/:id/transfer
router.post('/:id/transfer', async (req, res) => {
    const { id } = req.params;
    const { newEmployerId, transferDate } = req.body; // YYYY-MM-DD

    if (!newEmployerId || !transferDate) {
        return res.status(400).json({ error: 'Missing defined parameters' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Find Current Active Deployment
            const currentDeployment = await tx.deployment.findFirst({
                where: {
                    workerId: id,
                    status: 'active'
                }
            });

            // 2. Close it
            if (currentDeployment) {
                const newStart = new Date(transferDate);
                const oldEnd = new Date(newStart);
                oldEnd.setDate(oldEnd.getDate() - 1);

                await tx.deployment.update({
                    where: { id: currentDeployment.id },
                    data: {
                        status: 'ended',
                        serviceStatus: 'transferred_out',
                        endDate: oldEnd
                    }
                });
            }

            // 3. Create New Deployment
            const newDeployment = await tx.deployment.create({
                data: {
                    workerId: id,
                    employerId: newEmployerId,
                    startDate: new Date(transferDate),
                    status: 'active',
                    serviceStatus: 'active_service',
                    sourceType: 'transfer_in'
                }
            });

            return newDeployment;
        });

        res.json(result);
    } catch (error) {
        console.error('Transfer Error:', error);
        res.status(500).json({ error: 'Failed to process transfer' });
    }
});

// POST /api/workers/:id/photo
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
    const { id } = req.params;
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }

        // Upload to MinIO
        const fileExt = path.extname(req.file.originalname);
        const fileName = `photo-${id}${fileExt}`; // Consistent naming or unique? 
        // Let's use unique key to avoid cache issues if they re-upload often, or just overwrite.
        // Returning key is important.

        const { storageKey } = await storageService.uploadFile(
            req.file.buffer,
            `worker-photo-${id}-${Date.now()}${fileExt}`, // Unique key
            req.file.mimetype
        );

        const updatedWorker = await prisma.worker.update({
            where: { id },
            data: { photoUrl: storageKey }
        });

        // Return Presigned URL for immediate display
        const presignedUrl = await storageService.getPresignedUrl(storageKey);

        res.json({
            message: 'Photo uploaded successfully',
            photoUrl: presignedUrl,
            worker: { ...updatedWorker, photoUrl: presignedUrl }
        });
    } catch (error: any) {
        console.error('Upload Photo Error:', error);
        // Multer Memory Storage doesn't need cleanup of local files
        res.status(500).json({ error: 'Failed to upload photo' });
    }
});

// POST /api/workers/:id/arrange-entry
router.post('/:id/arrange-entry', async (req, res) => {
    const { id } = req.params;
    const { flightNumber, flightArrivalDate, pickupPerson } = req.body;

    if (!flightArrivalDate) {
        return res.status(400).json({ error: 'Flight arrival date is required' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Worker Info (Pickup Person)
            await tx.worker.update({
                where: { id },
                data: {
                    flightArrivalInfo: pickupPerson,
                }
            });

            // 2. Update Active/Pending Deployment (Flight Info triggers Timelines)
            // We find the latest one
            const currentDeployment = await tx.deployment.findFirst({
                where: {
                    workerId: id,
                    status: { in: ['active', 'pending'] }
                },
                orderBy: { startDate: 'desc' }
            });

            if (!currentDeployment) {
                throw new Error('No active or pending deployment found to arrange entry for.');
            }

            const updatedDeployment = await tx.deployment.update({
                where: { id: currentDeployment.id },
                data: {
                    flightNumber,
                    flightArrivalDate: new Date(flightArrivalDate),
                    entryDate: new Date(flightArrivalDate),
                }
            });

            // Timeline auto-calc disabled due to removed schema

            return updatedDeployment;
        });

        res.json(result);
    } catch (error: any) {
        console.error('Arrange Entry Error:', error);
        res.status(500).json({ error: error.message || 'Failed to arrange entry' });
    }
});

// POST /api/workers/:id/assign-team
router.post('/:id/assign-team', async (req, res) => {
    const { id } = req.params;
    const { salesId, serviceId, adminId, translatorId } = req.body;

    try {
        // We handle each role separately implicitly
        // Roles: sales_agent, service_staff, admin_staff, translator

        const roleMap: Record<string, string> = {};
        if (salesId) roleMap['sales_agent'] = salesId;
        if (serviceId) roleMap['service_staff'] = serviceId;
        if (adminId) roleMap['admin_staff'] = adminId;
        if (translatorId) roleMap['translator'] = translatorId;

        const result = await prisma.$transaction(async (tx: any) => {
            const results: any = {};

            for (const [role, newUserId] of Object.entries(roleMap)) {
                // 1. Find valid active assignment for this role
                const activeAssignment = await tx.serviceAssignment.findFirst({
                    where: {
                        workerId: id,
                        role: role as any,
                        endDate: null
                    }
                });

                // If already assigned to same user, do nothing
                if (activeAssignment && activeAssignment.internalUserId === newUserId) {
                    continue;
                }

                // If assigned to diff user, close it
                if (activeAssignment) {
                    await tx.serviceAssignment.update({
                        where: { id: activeAssignment.id },
                        data: { endDate: new Date() }
                    });
                }

                // Create new assignment
                const newAssignment = await tx.serviceAssignment.create({
                    data: {
                        workerId: id,
                        internalUserId: newUserId,
                        role: role,
                        startDate: new Date()
                    }
                });
                results[role] = newAssignment;
            }
            return results;
        });

        res.json(result);

    } catch (error: any) {
        console.error('Assign Team Error:', error);
        res.status(500).json({ error: 'Failed to assign team' });
    }
});

export default router;
