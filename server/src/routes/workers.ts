
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/workers
router.get('/', async (req, res) => {
    try {
        const {
            q,
            status,
            nationality,
            page = '1',
            limit = '10'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = parseInt(limit as string);
        const skip = (pageNum - 1) * limitNum;

        // Build Where Clause
        const whereClause: any = {};
        const andConditions = [];

        // 1. Keyword Search (Name, Passport, ARC)
        if (q) {
            const keyword = q as string;
            andConditions.push({
                OR: [
                    { englishName: { contains: keyword } }, // SQLite is case-insensitive by default for ASCII, but usually depends on collation
                    { chineseName: { contains: keyword } },
                    {
                        passports: {
                            some: { passportNumber: { contains: keyword } }
                        }
                    },
                    {
                        arcs: {
                            some: { arcNumber: { contains: keyword } }
                        }
                    }
                ]
            });
        }

        // 2. Exact Filters
        if (nationality) {
            andConditions.push({ nationality });
        }

        // Status Logic: Check if they have an active deployment
        if (status) {
            if (status === 'active') {
                andConditions.push({
                    deployments: {
                        some: { status: 'active' }
                    }
                });
            } else if (status === 'inactive') {
                andConditions.push({
                    deployments: {
                        none: { status: 'active' }
                    }
                });
            }
        }


        // 3. Quick Filters
        const { filter } = req.query;
        if (filter) {
            const now = new Date();
            const in30Days = new Date(); in30Days.setDate(in30Days.getDate() + 30);
            const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);

            if (filter === 'expiring_30') {
                // Deployment ending soon
                andConditions.push({
                    deployments: {
                        some: {
                            status: 'active',
                            endDate: {
                                gte: now,
                                lte: in30Days
                            }
                        }
                    }
                });
            } else if (filter === 'arriving_week') {
                // Flight arriving soon
                andConditions.push({
                    deployments: {
                        some: {
                            status: { in: ['active', 'pending'] },
                            flightArrivalDate: {
                                gte: now,
                                lte: nextWeek
                            }
                        }
                    }
                });
            } else if (filter === 'missing_docs') {
                // Workers with NO current passport OR NO current ARC
                andConditions.push({
                    OR: [
                        {
                            passports: {
                                none: { isCurrent: true }
                            }
                        },
                        {
                            arcs: {
                                none: { isCurrent: true }
                            }
                        }
                    ]
                });
            }
        }

        if (andConditions.length > 0) {
            whereClause.AND = andConditions;
        }

        // Execute Query with Pagination
        const [total, workers] = await Promise.all([
            prisma.worker.count({ where: whereClause }),
            prisma.worker.findMany({
                where: whereClause,
                include: {
                    deployments: {
                        where: { status: 'active' },
                        take: 1,
                        include: { employer: { select: { companyName: true } } }
                    },
                    passports: {
                        where: { isCurrent: true },
                        take: 1
                    }
                },
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        res.json({
            data: workers,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error) {
        console.error('Search Workers Error:', error);
        res.status(500).json({ error: 'Failed to search workers' });
    }
});

// GET /api/workers/:id
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const worker = await prisma.worker.findUnique({
            where: { id },
            include: {
                // Documents
                passports: { orderBy: { issueDate: 'desc' } },
                arcs: { orderBy: { issueDate: 'desc' } },

                // Deployment & Timeline
                deployments: {
                    include: {
                        employer: true,
                        recruitmentLetter: true,
                        timelines: true, // WorkerTimeline
                        permitDetails: {
                            include: {
                                permitDocument: true
                            }
                        },
                        feeSchedules: {
                            orderBy: { installmentNo: 'asc' }
                        }
                    },
                    orderBy: { startDate: 'desc' }
                },

                // Incidents
                incidents: {
                    orderBy: { incidentDate: 'desc' }
                },

                // Other
                addressHistory: { orderBy: { startDate: 'desc' } },

                insurances: { orderBy: { startDate: 'desc' } },
                healthChecks: { orderBy: { checkDate: 'desc' } },
                serviceAssignments: {
                    where: { endDate: null }, // Active Only
                    include: { internalUser: true }
                }
            }
        });

        if (!worker) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        res.json(worker);
    } catch (error) {
        console.error('Worker Detail Error:', error);
        res.status(500).json({ error: 'Failed to fetch worker details' });
    }
});

// POST /api/workers
router.post('/', async (req, res) => {
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

        if (!englishName || !nationality || !dob) {
            return res.status(400).json({ error: 'Missing required fields: englishName, nationality, dob' });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Worker
            const worker = await tx.worker.create({
                data: {
                    englishName,
                    chineseName,
                    nationality,
                    dob: new Date(dob),
                    mobilePhone,
                    category: 'general' // Default
                }
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
        const result = await prisma.$transaction(async (tx) => {
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
                    foreignAddress: body.foreignAddress,
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
                }
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

                // Auto-Calculate Deadlines if entryDate is updated
                if (body.entryDate) {
                    const entry = new Date(body.entryDate);
                    const med6 = new Date(entry); med6.setMonth(med6.getMonth() + 6);
                    const med18 = new Date(entry); med18.setMonth(med18.getMonth() + 18);
                    const med30 = new Date(entry); med30.setMonth(med30.getMonth() + 30);

                    // Upsert Timeline
                    await tx.workerTimeline.upsert({
                        where: { deploymentId: activeDeployment.id },
                        update: {
                            medCheck6moDeadline: med6,
                            medCheck18moDeadline: med18,
                            medCheck30moDeadline: med30
                        },
                        create: {
                            deploymentId: activeDeployment.id,
                            medCheck6moDeadline: med6,
                            medCheck18moDeadline: med18,
                            medCheck30moDeadline: med30
                        }
                    });
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

            // 3. Auto-Calculate Health Check Deadlines
            // 6 months, 18 months, 30 months from entry date
            const entry = new Date(flightArrivalDate);
            const med6 = new Date(entry); med6.setMonth(med6.getMonth() + 6);
            const med18 = new Date(entry); med18.setMonth(med18.getMonth() + 18);
            const med30 = new Date(entry); med30.setMonth(med30.getMonth() + 30);

            // Upsert Timeline
            await tx.workerTimeline.upsert({
                where: { deploymentId: currentDeployment.id },
                update: {
                    medCheck6moDeadline: med6,
                    medCheck18moDeadline: med18,
                    medCheck30moDeadline: med30
                },
                create: {
                    deploymentId: currentDeployment.id,
                    medCheck6moDeadline: med6,
                    medCheck18moDeadline: med18,
                    medCheck30moDeadline: med30
                }
            });

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

        const result = await prisma.$transaction(async (tx) => {
            const results: any = {};

            for (const [role, newUserId] of Object.entries(roleMap)) {
                // 1. Find valid active assignment for this role
                const activeAssignment = await tx.serviceAssignment.findFirst({
                    where: {
                        workerId: id,
                        role: role,
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
