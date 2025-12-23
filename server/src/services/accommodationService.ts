import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';

/**
 * Assign a bed to a worker, creating a history record.
 * This does NOT handle vacating a previous bed; ensure the worker is free first or use relocateWorker.
 */
export const assignBed = async (workerId: string, bedId: string, startDate: Date | string) => {
    return await prisma.$transaction(async (tx) => {
        const start = new Date(startDate);

        // 1. Update Worker's Current Bed (Cache)
        // Check if bed is occupied
        const bed = await tx.dormitoryBed.findUnique({ where: { id: bedId } });
        if (!bed) throw new Error('Bed not found');
        if (bed.isOccupied) throw new Error('Bed is already occupied');

        await tx.worker.update({
            where: { id: workerId },
            data: { bedId: bedId }
        });

        // 2. Mark Bed as Occupied
        await tx.dormitoryBed.update({
            where: { id: bedId },
            data: { isOccupied: true }
        });

        // 3. Create History Record
        // Find current active history to close it? No, this function assumes clean state.
        // But for safety, let's close any open history just in case, though relocateWorker is preferred.
        await tx.workerAccommodationHistory.updateMany({
            where: { workerId: workerId, isCurrent: true },
            data: { isCurrent: false, endDate: start }
        });

        const history = await tx.workerAccommodationHistory.create({
            data: {
                workerId,
                dormitoryBedId: bedId,
                startDate: start,
                isCurrent: true
            }
        });

        return history;
    });
};

/**
 * Vacate the current bed/accommodation for a worker.
 */
export const vacateBed = async (workerId: string, endDate: Date | string) => {
    return await prisma.$transaction(async (tx) => {
        const end = new Date(endDate);

        const worker = await tx.worker.findUnique({ where: { id: workerId } });
        if (!worker) throw new Error('Worker not found');

        // 1. Free the bed if assigned
        if (worker.bedId) {
            await tx.dormitoryBed.update({
                where: { id: worker.bedId },
                data: { isOccupied: false }
            });

            await tx.worker.update({
                where: { id: workerId },
                data: { bedId: null }
            });
        }

        // 2. Close History
        await tx.workerAccommodationHistory.updateMany({
            where: { workerId, isCurrent: true },
            data: { isCurrent: false, endDate: end }
        });

        return true;
    });
};

/**
 * Relocate a worker from one place to another.
 * Can be Bed -> Bed, Bed -> External Address, External -> Bed.
 */
export const relocateWorker = async (
    workerId: string,
    newLocation: { bedId?: string, address?: string },
    effectiveDate: Date | string
) => {
    return await prisma.$transaction(async (tx) => {
        const date = new Date(effectiveDate);

        // 1. Get current location for notification
        const currentHistory = await tx.workerAccommodationHistory.findFirst({
            where: { workerId, isCurrent: true },
            include: { dormitoryBed: { include: { room: { include: { dormitory: true } } } } }
        });

        let oldAddress = currentHistory?.address;
        if (currentHistory?.dormitoryBed) {
            const dorm = currentHistory.dormitoryBed.room.dormitory;
            oldAddress = `${dorm.name} - ${dorm.address}`;
        }

        // 2. Vacate current
        if (currentHistory) {
            // Free bed if needed
            if (currentHistory.dormitoryBedId) {
                await tx.dormitoryBed.update({
                    where: { id: currentHistory.dormitoryBedId },
                    data: { isOccupied: false }
                });
            }

            await tx.workerAccommodationHistory.update({
                where: { id: currentHistory.id },
                data: { isCurrent: false, endDate: date }
            });
        }

        // Also update Worker.bedId cache
        await tx.worker.update({ where: { id: workerId }, data: { bedId: null } });

        // 3. Assign New
        let newAddressString = newLocation.address;

        if (newLocation.bedId) {
            const bed = await tx.dormitoryBed.findUnique({
                where: { id: newLocation.bedId },
                include: { room: { include: { dormitory: true } } }
            });
            if (!bed) throw new Error('New bed not found');
            if (bed.isOccupied) throw new Error('New bed is occupied');

            await tx.dormitoryBed.update({ where: { id: bed.id }, data: { isOccupied: true } });
            await tx.worker.update({ where: { id: workerId }, data: { bedId: bed.id } });

            newAddressString = `${bed.room.dormitory.name} - ${bed.room.dormitory.address}`; // Approximate for notification
        }

        const newHistory = await tx.workerAccommodationHistory.create({
            data: {
                workerId,
                dormitoryBedId: newLocation.bedId || null,
                address: newLocation.address || null, // If bed is null, use address string
                startDate: date,
                isCurrent: true
            }
        });

        // 4. Create Relocation Notification
        if (oldAddress && newAddressString && oldAddress !== newAddressString) {
            await tx.relocationNotification.create({
                data: {
                    workerId,
                    oldAddress,
                    newAddress: newAddressString,
                    status: 'PENDING'
                }
            });
        }

        return newHistory;
    });
};

export const getAccommodationHistory = async (workerId: string) => {
    return await prisma.workerAccommodationHistory.findMany({
        where: { workerId },
        orderBy: { startDate: 'desc' },
        include: {
            dormitoryBed: {
                include: {
                    room: {
                        include: {
                            dormitory: true
                        }
                    }
                }
            }
        }
    });
};
