
import { Router } from 'express';
import prisma from '../prisma';

const router = Router();

// GET /api/dormitories
// List all dormitories with high-level stats (calculated from rooms/beds)
router.get('/', async (req, res) => {
    try {
        const dorms = await prisma.dormitory.findMany({
            include: {
                rooms: {
                    include: {
                        beds: {
                            where: { status: 'occupied' } // To count occupancy
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Compute stats
        const result = dorms.map(d => {
            const totalCapacity = d.rooms.reduce((acc, r) => acc + r.capacity, 0);
            const occupied = d.rooms.reduce((acc, r) => acc + r.beds.length, 0); // beds filtered by occupied

            // Remove full nested structure for list view, keep stats
            const { rooms, ...rest } = d;
            return {
                ...rest,
                totalCapacity,
                currentOccupancy: occupied
            };
        });

        res.json(result);
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
            const bed = await tx.dormBed.findUnique({ where: { id: bedId }, include: { worker: true } });
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

export default router;
