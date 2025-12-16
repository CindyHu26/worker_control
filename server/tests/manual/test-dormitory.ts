
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDormitory() {
    console.log("=== Testing Dormitory Logic ===");

    const prefix = `TEST_DORM_${Date.now()}`;

    // 1. Setup
    // Create Dorm
    const dorm = await prisma.dormitory.create({
        data: {
            name: `${prefix}_Name`,
            address: `${prefix}_Addr`,
            capacity: 10,
            currentOccupancy: 0
        }
    });

    // Create Room
    const room = await prisma.dormRoom.create({
        data: {
            dormitoryId: dorm.id,
            roomNumber: '101',
            capacity: 2,
            currentHeadCount: 0
        }
    });

    // Create Bed
    const bed = await prisma.dormBed.create({
        data: {
            roomId: room.id,
            bedCode: 'A',
            status: 'vacant'
        }
    });

    // Create Worker
    const worker = await prisma.worker.create({
        data: {
            englishName: `${prefix}_Worker`,
            dob: new Date('2000-01-01'),
            nationality: 'VN'
        }
    });

    console.log(`Setup complete. Dorm: ${dorm.id}, Room: ${room.id}, Bed: ${bed.id}, Worker: ${worker.id}`);

    // 2. Simulation: Assign
    console.log("--- Simulating Assign ---");
    // In a real route, this is a transaction
    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: { id: worker.id },
            data: { dormitoryBedId: bed.id, dormitoryId: dorm.id }
        });
        await tx.dormBed.update({
            where: { id: bed.id },
            data: { status: 'occupied' }
        });
        await tx.dormRoom.update({
            where: { id: room.id },
            data: { currentHeadCount: { increment: 1 } }
        });
        await tx.dormitory.update({
            where: { id: dorm.id },
            data: { currentOccupancy: { increment: 1 } }
        });
    });

    // Verify Assign
    const dormAfterAssign = await prisma.dormitory.findUnique({ where: { id: dorm.id } });
    const roomAfterAssign = await prisma.dormRoom.findUnique({ where: { id: room.id } });

    console.log(`Dorm Occupancy: ${dormAfterAssign?.currentOccupancy} (Expected 1)`);
    console.log(`Room HeadCount: ${roomAfterAssign?.currentHeadCount} (Expected 1)`);

    if (dormAfterAssign?.currentOccupancy !== 1) throw new Error("Assign: Dorm Occupancy Mismatch");
    if (roomAfterAssign?.currentHeadCount !== 1) throw new Error("Assign: Room HeadCount Mismatch");

    // 3. Simulation: Unassign
    console.log("--- Simulating Unassign ---");
    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: { id: worker.id },
            data: { dormitoryBedId: null }
        });
        await tx.dormBed.update({
            where: { id: bed.id },
            data: { status: 'vacant' }
        });
        await tx.dormRoom.update({
            where: { id: room.id },
            data: { currentHeadCount: { decrement: 1 } }
        });
        // Note: In logic we find dorm via room
        await tx.dormitory.update({
            where: { id: dorm.id },
            data: { currentOccupancy: { decrement: 1 } }
        });
    });

    // Verify Unassign
    const dormAfterUnassign = await prisma.dormitory.findUnique({ where: { id: dorm.id } });
    const roomAfterUnassign = await prisma.dormRoom.findUnique({ where: { id: room.id } });

    console.log(`Dorm Occupancy: ${dormAfterUnassign?.currentOccupancy} (Expected 0)`);
    console.log(`Room HeadCount: ${roomAfterUnassign?.currentHeadCount} (Expected 0)`);

    if (dormAfterUnassign?.currentOccupancy !== 0) throw new Error("Unassign: Dorm Occupancy Mismatch");
    if (roomAfterUnassign?.currentHeadCount !== 0) throw new Error("Unassign: Room HeadCount Mismatch");

    // 4. Cleanup
    await prisma.dormitory.delete({ where: { id: dorm.id } }); // Cascades to rooms/beds
    await prisma.worker.delete({ where: { id: worker.id } });

    console.log("=== Dormitory Test Passed ===");
}

testDormitory()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
