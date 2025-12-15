
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/dormitories
// List all dormitories with high-level stats (calculated from rooms/beds)
router.get('/', async (req, res) => {
    try {
        const dorms = await prisma.dormitory.findMany({
            orderBy: { createdAt: 'desc' }
        });

        res.json(dorms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dormitories' });
    }
});

// POST /api/dormitories
router.post('/', async (req, res) => {
    try {
        const { name, address, landlordName, landlordPhone, accommodationType, safetyInspectionDate } = req.body;
        const dorm = await prisma.dormitory.create({
            data: {
                name, address, landlordName, landlordPhone, accommodationType,
                safetyInspectionDate: safetyInspectionDate ? new Date(safetyInspectionDate) : undefined
            }
        });
        res.status(201).json(dorm);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create dormitory' });
    }
});

// GET /api/dormitories/:id/structure
// Return full hierarchy
router.get('/:id/structure', async (req, res) => {
    try {
        const { id } = req.params;
        const dorm = await prisma.dormitory.findUnique({
            where: { id },
            include: {
                rooms: {
                    orderBy: { roomNumber: 'asc' },
                    include: {
                        beds: {
                            orderBy: { bedCode: 'asc' },
                            include: {
                                worker: {
                                    select: { id: true, chineseName: true, englishName: true, gender: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!dorm) return res.status(404).json({ error: 'Dormitory not found' });
        res.json(dorm);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch structure' });
    }
});

// POST /api/dormitories/:id/rooms
// Create Room & Auto-generate Beds
router.post('/:id/rooms', async (req, res) => {
    try {
        const { id } = req.params;
        const { roomNumber, capacity, gender, floor } = req.body;

        await prisma.$transaction(async (tx) => {
            // Create Room
            const room = await tx.dormRoom.create({
                data: {
                    dormitoryId: id,
                    roomNumber,
                    capacity: Number(capacity),
                    gender,
                    floor: floor ? Number(floor) : undefined
                }
            });

            // Auto-create Beds
            // Generate codes: 1, 2, 3... or A, B, C... ? 
            // Defaulting to numeric "1", "2"... as per typical dorms
            for (let i = 1; i <= Number(capacity); i++) {
                await tx.dormBed.create({
                    data: {
                        roomId: room.id,
                        bedCode: String(i),
                        status: 'vacant'
                    }
                });
            }
        });

        res.json({ message: 'Room and beds created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create room' });
    }
});

// POST /api/dormitories/beds/:bedId/assign
router.post('/beds/:bedId/assign', async (req, res) => {
    try {
        const { bedId } = req.params;
        const { workerId } = req.body;

        await prisma.$transaction(async (tx) => {
            // 1. Check Bed Status
            const bed = await tx.dormBed.findUnique({ where: { id: bedId } });
            if (!bed) throw new Error("Bed not found");
            if (bed.status !== 'vacant') throw new Error("Bed is not vacant");

            // 2. Check Worker (ensure not already in another bed? schema unique constraint handles this but friendly error better)
            const worker = await tx.worker.findUnique({ where: { id: workerId } });
            if (!worker) throw new Error("Worker not found");
            if (worker.dormitoryBedId) throw new Error("Worker already assigned to a bed");

            // 3. Assign
            await tx.worker.update({
                where: { id: workerId },
                data: {
                    dormitoryBedId: bedId,
                    dormitoryId: (await tx.dormRoom.findUnique({ where: { id: bed.roomId } }))?.dormitoryId // Sync legacy ID? Optional but good for consistency.
                }
            });

            await tx.dormBed.update({
                where: { id: bedId },
                data: { status: 'occupied' }
            });

            // 4. Update Counters
            // Increment Room Headcount
            await tx.dormRoom.update({
                where: { id: bed.roomId },
                data: { currentHeadCount: { increment: 1 } }
            });

            // Increment Dormitory Occupancy
            // need to find dormitoryId first if not available, but we can get it from the room update return if we wanted, or just separate query. 
            // The room.dormitoryId is available if we fetched it, or just do a nested update? 
            // Let's just fetch the room properly first or update via relation if possible. 
            // Simplest is to just update using the roomId we have.
            // Wait, we only have bed.roomId. 
            const room = await tx.dormRoom.findUnique({ where: { id: bed.roomId } });
            if (room) {
                await tx.dormitory.update({
                    where: { id: room.dormitoryId },
                    data: { currentOccupancy: { increment: 1 } }
                });
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/dormitories/beds/:bedId/unassign
router.post('/beds/:bedId/unassign', async (req, res) => {
    try {
        const { bedId } = req.params;

        await prisma.$transaction(async (tx) => {
            const bed = await tx.dormBed.findUnique({ where: { id: bedId }, include: { worker: true, room: true } });
            if (!bed) throw new Error("Bed not found");

            if (bed.worker) {
                await tx.worker.update({
                    where: { id: bed.worker.id },
                    data: { dormitoryBedId: null } // dormitoryId? Keep or clear? Maybe keep as history location? Or clear. I'll clear.
                });
            }

            await tx.dormBed.update({
                where: { id: bedId },
                data: { status: 'vacant' }
            });

            // Update Counters
            await tx.dormRoom.update({
                where: { id: bed.roomId },
                data: { currentHeadCount: { decrement: 1 } }
            });

            await tx.dormitory.update({
                where: { id: bed.room.dormitoryId },
                data: { currentOccupancy: { decrement: 1 } }
            });
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/dormitories/meters/:id/record
// Record meter reading and generate cost split bills
router.post('/meters/:id/record', async (req, res) => {
    try {
        const { id } = req.params;
        const { currentReading, readingDate } = req.body;

        if (currentReading === undefined || !readingDate) {
            return res.status(400).json({ error: 'Missing currentReading or readingDate' });
        }

        await prisma.$transaction(async (tx) => {
            const meter = await tx.dormMeter.findUnique({
                where: { id },
                include: {
                    room: {
                        include: {
                            beds: {
                                where: { status: 'occupied' },
                                include: {
                                    worker: {
                                        include: { deployments: { where: { status: 'active' } } }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!meter) throw new Error("Meter not found");

            // Find previous reading
            const lastReading = await tx.meterReading.findFirst({
                where: { meterId: id, readingDate: { lt: new Date(readingDate) } },
                orderBy: { readingDate: 'desc' }
            });

            const prevValue = lastReading ? Number(lastReading.readingValue) : 0; // Or handle initial
            const currValue = Number(currentReading);
            const usage = currValue - prevValue;

            if (usage < 0) throw new Error("Current reading cannot be less than previous reading");

            const cost = usage * Number(meter.ratePerUnit);

            // Create Reading Record
            const newReading = await tx.meterReading.create({
                data: {
                    meterId: id,
                    readingDate: new Date(readingDate),
                    readingValue: currValue,
                    usage: usage,
                    cost: cost,
                    isBilled: true // We are billing immediately
                }
            });

            // Split Cost
            const activeWorkers = meter.room.beds.map(b => b.worker).filter(w => w !== null);
            const count = activeWorkers.length;

            if (count > 0 && cost > 0) {
                const splitAmount = Math.round(cost / count); // Simple rounding
                const billDate = new Date();
                const year = billDate.getFullYear();
                const month = billDate.getMonth() + 1;

                for (const worker of activeWorkers) {
                    if (!worker) continue;

                    // Create Bill
                    const billNo = `UTIL-${year}${String(month).padStart(2, '0')}-${worker.id.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

                    // Finds active deployment ID if available
                    const deploymentId = worker.deployments?.[0]?.id;

                    await tx.bill.create({
                        data: {
                            billNo,
                            payerType: 'worker',
                            workerId: worker.id,
                            deploymentId: deploymentId,
                            year,
                            month,
                            billingDate: billDate,
                            dueDate: new Date(billDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days due
                            totalAmount: splitAmount,
                            status: 'draft',
                            items: {
                                create: {
                                    description: `${month}月 ${meter.meterType === 'electricity' ? '電費' : '水費'}分攤 (用量:${usage}, 總金額:${cost}, 人數:${count})`,
                                    amount: splitAmount,
                                    feeCategory: 'utility_fee'
                                }
                            }
                        }
                    });
                }
            }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// POST /api/dormitories/calculate-cost-split
router.post('/calculate-cost-split', async (req, res) => {
    try {
        const { year, month, totalAmount, dormitoryId, roomId, description } = req.body;

        if (!year || !month || !totalAmount) {
            return res.status(400).json({ error: 'Year, Month, and Amount are required' });
        }
        if (!dormitoryId && !roomId) {
            return res.status(400).json({ error: 'DormitoryId or RoomId required' });
        }

        const startOfMonth = new Date(Number(year), Number(month) - 1, 1);
        const endOfMonth = new Date(Number(year), Number(month), 0); // Last day
        const daysInMonth = endOfMonth.getDate();

        await prisma.$transaction(async (tx) => {
            // 1. Find Workers
            let workers: any[] = [];
            if (roomId) {
                const room = await tx.dormRoom.findUnique({
                    where: { id: roomId },
                    include: { beds: { include: { worker: { include: { deployments: { where: { status: 'active' } } } } } } }
                });
                workers = room?.beds.map(b => b.worker).filter(w => w !== null) || [];
            } else if (dormitoryId) {
                const dorm = await tx.dormitory.findUnique({
                    where: { id: dormitoryId },
                    include: { workers: { include: { deployments: { where: { status: 'active' } } } } }
                });
                workers = dorm?.workers || [];
            }

            if (workers.length === 0) {
                throw new Error("No workers found in target location");
            }

            // 2. Calculate Occupancy Days
            const workerCalculations = workers.map(w => {
                const deployment = w.deployments?.[0]; // Assuming active deployment
                let stayDays = daysInMonth;

                if (deployment && deployment.entryDate) {
                    const entry = new Date(deployment.entryDate);
                    // If entered AFTER start of month
                    if (entry > startOfMonth) {
                        if (entry > endOfMonth) {
                            stayDays = 0;
                        } else {
                            const diff = endOfMonth.getTime() - entry.getTime();
                            stayDays = Math.floor(diff / (1000 * 3600 * 24)) + 1;
                        }
                    }
                }

                if (stayDays < 0) stayDays = 0;

                return { worker: w, days: stayDays };
            });

            // 3. Sum Total Days
            const totalOccupancyDays = workerCalculations.reduce((sum, item) => sum + item.days, 0);

            if (totalOccupancyDays === 0) {
                throw new Error("Total occupancy days is zero. Cannot split cost.");
            }

            // 4. Generate Bills
            const costPerDay = Number(totalAmount) / totalOccupancyDays;

            for (const item of workerCalculations) {
                if (item.days <= 0) continue;

                const workerShare = Math.round(costPerDay * item.days);
                const worker = item.worker;

                const billNo = `UTIL-${year}${String(month).padStart(2, '0')}-${worker.id.substring(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

                await tx.bill.create({
                    data: {
                        billNo,
                        payerType: 'worker',
                        workerId: worker.id,
                        deploymentId: worker.deployments?.[0]?.id,
                        year: Number(year),
                        month: Number(month),
                        billingDate: new Date(),
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        totalAmount: workerShare,
                        status: 'draft',
                        items: {
                            create: {
                                description: description || `Utility Split (${month}/${year}) - ${item.days} days`,
                                amount: workerShare,
                                feeCategory: 'utility_fee'
                            }
                        }
                    }
                });
            }
        });

        res.json({ message: 'Utility split calculated and billed successfully' });

    } catch (error: any) {
        console.error('Split Utility Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// New Advanced Management Endpoints
// ============================================

// POST /api/dormitories/:id/equipment/batch
// Batch create equipment
router.post('/:id/equipment/batch', async (req, res) => {
    try {
        const { id } = req.params;
        const { prefix, startNum, endNum, category, brandModel, location, maintenanceIntervalMonths } = req.body;

        const { batchCreateEquipment } = await import('../services/dormService');
        const result = await batchCreateEquipment(id, prefix, startNum, endNum, {
            category,
            brandModel,
            location,
            maintenanceIntervalMonths
        });

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/dormitories/maintenance/:id/complete
// Complete maintenance and trigger auto-scheduling
router.post('/maintenance/:id/complete', async (req, res) => {
    try {
        const { id } = req.params;
        const { completionDate } = req.body;

        const maintenance = await prisma.maintenanceLog.findUnique({ where: { id } });
        if (!maintenance) {
            return res.status(404).json({ error: 'Maintenance log not found' });
        }

        await prisma.maintenanceLog.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                completionDate: completionDate ? new Date(completionDate) : new Date()
            }
        });

        // Trigger auto-scheduling if equipment is linked
        if (maintenance.equipmentId) {
            const { scheduleNextMaintenance } = await import('../services/dormService');
            const nextDate = await scheduleNextMaintenance(
                maintenance.equipmentId,
                completionDate ? new Date(completionDate) : new Date()
            );

            return res.json({ success: true, nextMaintenanceDate: nextDate });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/dormitories/maintenance/:id/archive-expense
// Convert maintenance to annual expense
router.post('/maintenance/:id/archive-expense', async (req, res) => {
    try {
        const { id } = req.params;
        const { amortizationMonths } = req.body;

        const { convertMaintenanceToExpense } = await import('../services/dormService');
        const result = await convertMaintenanceToExpense(id, amortizationMonths || 12);

        res.json({ success: true, result });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dormitories/:id/analytics/utility-anomalies
// Run utility anomaly detection
router.get('/:id/analytics/utility-anomalies', async (req, res) => {
    try {
        const { id } = req.params;
        const { meterId } = req.query;

        const { detectUtilityAnomalies } = await import('../services/analyticsService');
        const result = await detectUtilityAnomalies(id, meterId as string | undefined);

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/dormitories/:id/compliance/area
// Check area compliance
router.get('/:id/compliance/area', async (req, res) => {
    try {
        const { id } = req.params;
        const standard = Number(req.query.standard) || 3.6;

        const { checkAreaCompliance } = await import('../services/analyticsService');
        const result = await checkAreaCompliance(id, standard);

        res.json(result);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

export default router;


