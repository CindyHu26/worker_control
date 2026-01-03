import { Router } from 'express';
import prisma from '../prisma';
import { createWorkerWithJobOrder, getWorkerDashboardData } from '../services/workerService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for Worker Photos
// Configure Multer for Worker Photos
import { storageService } from '../services/storageService';
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
        const result = await createWorkerWithJobOrder(body);

        res.status(201).json(result);
    } catch (error: any) {
        console.error('Full Entry Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create worker entry' });
    }
});

// POST /api/workers (Legacy - Redirect to Full Entry logic or separate)
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        const result = await createWorkerWithJobOrder(body);
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
            // 1. Separate Dynamic Attributes
            // We need to fetch existing attributes to merge? Or just overwrite?
            // Usually merge is safer, but for a full form save, overwrite is often desired.
            // Let's assume the frontend sends the *complete* set of attributes it knows about.

            // However, we need to be careful not to overwrite other JSON keys if we had multiple modules using it.
            // For now, let's just use the helper to extract new attributes.
            const dynamicAttributes = separateAttributes(body);

            // 2. Update Worker Fields
            const updatedWorker = await tx.worker.update({
                where: { id },
                data: {
                    englishName: body.englishName,
                    chineseName: body.chineseName,
                    nationalityId: body.nationalityId, // Relation ID
                    gender: body.gender,
                    dob: body.dob ? new Date(body.dob) : undefined,

                    // ... mapped standard fields ...
                    mobilePhone: body.mobilePhone,
                    overseasContactPhone: body.overseasContactPhone,
                    overseasFamilyContact: body.overseasFamilyContact,
                    emergencyContactPhone: body.emergencyContactPhone,
                    lineId: body.lineId,
                    foreignCity: body.foreignCity,
                    // ... other address fields ...

                    // Merging logic for JSONB:
                    // Prisma doesn't support deep merge natively in update easily without raw query for some DBs,
                    // but for simple cases, replacing the object is fine if we send all keys.
                    // Or we can fetch first. Let's simplfy and write the object.
                    attributes: dynamicAttributes,
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
        const result = await prisma.$transaction(async (tx: any) => {
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
        const result = await prisma.$transaction(async (tx: any) => {
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

// POST /api/workers/:id/entry-filing (Create EntryFiling)
router.post('/:id/entry-filing', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        // Check if already exists
        const existing = await prisma.entryFiling.findUnique({
            where: { workerId: id }
        });

        if (existing) {
            return res.status(400).json({ error: 'Entry filing already exists. Use PUT to update.' });
        }

        const entryFiling = await prisma.entryFiling.create({
            data: {
                workerId: id,
                entryDate: body.entryDate ? new Date(body.entryDate) : new Date(),
                flightNo: body.flightNo,
                visaNo: body.visaNo,
                overseasMedicalDate: body.overseasMedicalDate ? new Date(body.overseasMedicalDate) : undefined,
                overseasMedicalHospital: body.overseasMedicalHospital,
                policeClearanceReceived: body.policeClearanceReceived || false,
                policeClearanceDate: body.policeClearanceDate ? new Date(body.policeClearanceDate) : undefined,
                laborInsuranceDate: body.laborInsuranceDate ? new Date(body.laborInsuranceDate) : undefined,
                healthInsuranceDate: body.healthInsuranceDate ? new Date(body.healthInsuranceDate) : undefined,
                airportCareRegistered: body.airportCareRegistered || false,
                notes: body.notes,
            }
        });

        res.status(201).json(entryFiling);
    } catch (error: any) {
        console.error('Create Entry Filing Error:', error);
        res.status(500).json({ error: error.message || 'Failed to create entry filing' });
    }
});

// PUT /api/workers/:id/entry-filing (Update EntryFiling)
router.put('/:id/entry-filing', async (req, res) => {
    const { id } = req.params;
    const body = req.body;

    try {
        const entryFiling = await prisma.entryFiling.update({
            where: { workerId: id },
            data: {
                entryDate: body.entryDate ? new Date(body.entryDate) : undefined,
                flightNo: body.flightNo,
                visaNo: body.visaNo,
                overseasMedicalDate: body.overseasMedicalDate ? new Date(body.overseasMedicalDate) : undefined,
                overseasMedicalHospital: body.overseasMedicalHospital,
                policeClearanceReceived: body.policeClearanceReceived,
                policeClearanceDate: body.policeClearanceDate ? new Date(body.policeClearanceDate) : undefined,
                laborInsuranceDate: body.laborInsuranceDate ? new Date(body.laborInsuranceDate) : undefined,
                healthInsuranceDate: body.healthInsuranceDate ? new Date(body.healthInsuranceDate) : undefined,
                airportCareRegistered: body.airportCareRegistered,
                notes: body.notes,
            }
        });

        res.json(entryFiling);
    } catch (error: any) {
        console.error('Update Entry Filing Error:', error);
        res.status(500).json({ error: error.message || 'Failed to update entry filing' });
    }
});

export default router;
