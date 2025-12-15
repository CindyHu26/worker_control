
import prisma from '../prisma';

// Equipment Auto-Scheduling
export const scheduleNextMaintenance = async (equipmentId: string, completionDate: Date) => {
    const equipment = await prisma.dormEquipment.findUnique({ where: { id: equipmentId } });

    if (!equipment || !equipment.maintenanceIntervalMonths) {
        return null; // No scheduling needed
    }

    // Calculate next maintenance date
    const nextDate = new Date(completionDate);
    nextDate.setMonth(nextDate.getMonth() + equipment.maintenanceIntervalMonths);

    // Update equipment
    await prisma.dormEquipment.update({
        where: { id: equipmentId },
        data: {
            lastMaintenanceDate: completionDate,
            nextMaintenanceDate: nextDate
        }
    });

    return nextDate;
};

// Batch Create Equipment
export const batchCreateEquipment = async (
    dormId: string,
    prefix: string,
    startNum: number,
    endNum: number,
    template: {
        category: string;
        brandModel?: string;
        location?: string;
        maintenanceIntervalMonths?: number;
    }
) => {
    const equipmentList = [];

    for (let i = startNum; i <= endNum; i++) {
        const paddedNum = String(i).padStart(2, '0');
        equipmentList.push({
            dormId,
            name: `${prefix}-${paddedNum}`,
            category: template.category,
            brandModel: template.brandModel,
            location: template.location,
            maintenanceIntervalMonths: template.maintenanceIntervalMonths,
            status: 'active'
        });
    }

    const result = await prisma.dormEquipment.createMany({
        data: equipmentList
    });

    return { count: result.count, items: equipmentList };
};

// Get Unassigned Workers
export const getUnassignedWorkers = async (dormId: string) => {
    // Find workers in this dormitory without a bed assignment
    const workers = await prisma.worker.findMany({
        where: {
            dormitoryId: dormId,
            dormitoryBedId: null
        },
        include: {
            deployments: {
                where: { status: 'active' },
                include: { employer: true }
            }
        }
    });

    return workers;
};

// Protected Room Assignment Update
export const updateRoomAssignment = async (
    workerId: string,
    bedId: string | null,
    source: 'MANUAL_ADJUSTMENT' | 'SYSTEM_IMPORT'
) => {
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });

    // Protection: Don't overwrite MANUAL_LOCKED data with system imports
    if (worker?.dataSource === 'MANUAL_LOCKED' && source === 'SYSTEM_IMPORT') {
        throw new Error('Cannot overwrite manually locked worker data with system import');
    }

    // Update worker
    await prisma.worker.update({
        where: { id: workerId },
        data: {
            dormitoryBedId: bedId,
            dataSource: source
        }
    });

    // Update bed status
    if (bedId) {
        await prisma.dormBed.update({
            where: { id: bedId },
            data: { status: 'occupied' }
        });
    }

    return true;
};

// Convert Maintenance to Annual Expense
export const convertMaintenanceToExpense = async (
    maintenanceId: string,
    amortizationMonths: number = 12
) => {
    const maintenance = await prisma.maintenanceLog.findUnique({
        where: { id: maintenanceId }
    });

    if (!maintenance || !maintenance.cost || maintenance.cost <= 0) {
        throw new Error('Invalid maintenance record for expense conversion');
    }

    const startDate = maintenance.completionDate || new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + amortizationMonths);

    // Create annual expense record (assuming an AnnualExpense model exists)
    // If not, this would need to be adjusted based on actual schema
    const expense = await prisma.$executeRaw`
        INSERT INTO annual_expenses (id, description, amount, amortization_start, amortization_end, source_ref_id, created_at, updated_at)
        VALUES (uuid_generate_v4(), ${`Maintenance: ${maintenance.description}`}, ${maintenance.cost}, ${startDate}, ${endDate}, ${maintenanceId}, NOW(), NOW())
    `;

    return expense;
};
