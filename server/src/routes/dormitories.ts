
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
        const { name, city, district, addressDetail, zipCode, accommodationType } = req.body;
        // landlordName, landlordPhone removed as they might not exist in schema
        const dorm = await prisma.dormitory.create({
            data: {
                name,
                city,
                district,
                addressDetail,
                zipCode,
                accommodationType,
                // safetyInspectionDate: safetyInspectionDate ? new Date(safetyInspectionDate) : undefined
            } as any
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

        await prisma.$transaction(async (tx: any) => {
            // Create Room
            const room = await tx.dormitoryRoom.create({
                data: {
                    dormitoryId: id,
                    roomNumber,
                    capacity: Number(capacity),
                    // gender, // Schema doesn't have gender on Room
                    // floor // No floor either.
                }
            });

            // Auto-create Beds
            for (let i = 1; i <= Number(capacity); i++) {
                await tx.dormitoryBed.create({
                    data: {
                        roomId: room.id,
                        bedCode: String(i),
                        isOccupied: false
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

        await prisma.$transaction(async (tx: any) => {
            // 1. Check Bed Status
            const bed = await tx.dormitoryBed.findUnique({ where: { id: bedId } });
            if (!bed) throw new Error("Bed not found");
            if (bed.isOccupied) throw new Error("Bed is not vacant");

            // 2. Check Worker
            // Check if worker is already assigned (optional, but good practice)
            const worker = await tx.worker.findUnique({ where: { id: workerId } });
            if (!worker) throw new Error("Worker not found");
            if (worker.bedId) throw new Error("Worker already assigned to a bed");

            // 3. Assign
            await tx.worker.update({
                where: { id: workerId },
                data: {
                    bedId: bedId
                }
            });

            await tx.dormitoryBed.update({
                where: { id: bedId },
                data: { isOccupied: true }
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

        await prisma.$transaction(async (tx: any) => {
            const bed = await tx.dormitoryBed.findUnique({ where: { id: bedId }, include: { worker: true, room: { include: { dormitory: true } } } });
            if (!bed) throw new Error("Bed not found");

            if (bed.worker) {
                await tx.worker.update({
                    where: { id: bed.worker.id },
                    data: { bedId: null }
                });
            }

            await tx.dormitoryBed.update({
                where: { id: bedId },
                data: { isOccupied: false }
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
// POST /api/dormitories/meters/:id/record (DISABLED - Bill/Meter Missing)
/*
router.post('/meters/:id/record', async (req, res) => {
    // ... disabled ...
    res.status(501).json({ error: 'Not Implemented' });
});
*/

// POST /api/dormitories/calculate-cost-split
// POST /api/dormitories/calculate-cost-split (DISABLED - Bill Missing)
/*
router.post('/calculate-cost-split', async (req, res) => {
     res.status(501).json({ error: 'Not Implemented' });
});
*/


// Maintenance routes removed due to missing MaintenanceLog model

// ============================================
// Maintenance / Equipment routes removed due to missing schema models
// ============================================

export default router;
