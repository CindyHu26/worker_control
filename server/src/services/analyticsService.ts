
import prisma from '../prisma';

// IQR-based Utility Anomaly Detection
export const detectUtilityAnomalies = async (dormId: string, meterId?: string) => {
    // Fetch meter readings for analysis
    const where: any = {};
    if (meterId) {
        where.meterId = meterId;
    } else {
        // Get all meters for this dorm
        const rooms = await prisma.dormRoom.findMany({
            where: { dormitoryId: dormId },
            select: { id: true }
        });
        const roomIds = rooms.map(r => r.id);
        where.meter = {
            roomId: { in: roomIds }
        };
    }

    const readings = await prisma.meterReading.findMany({
        where,
        include: { meter: true },
        orderBy: { readingDate: 'desc' },
        take: 100 // Last 100 readings for analysis
    });

    if (readings.length < 4) {
        return { anomalies: [], message: 'Insufficient data for analysis' };
    }

    // Group by meter
    const meterGroups = new Map<string, typeof readings>();
    readings.forEach(r => {
        const key = r.meterId;
        if (!meterGroups.has(key)) meterGroups.set(key, []);
        meterGroups.get(key)?.push(r);
    });

    const anomalies: any[] = [];

    for (const [meterId, meterReadings] of meterGroups) {
        if (meterReadings.length < 4) continue;

        // IQR Method
        const costs = meterReadings.map(r => Number(r.cost)).sort((a, b) => a - b);
        const q1Index = Math.floor(costs.length * 0.25);
        const q3Index = Math.floor(costs.length * 0.75);

        const Q1 = costs[q1Index];
        const Q3 = costs[q3Index];
        const IQR = Q3 - Q1;
        const upperBound = Q3 + 1.5 * IQR;
        const lowerBound = Q1 - 1.5 * IQR;

        // Check each reading
        meterReadings.forEach(reading => {
            const cost = Number(reading.cost);
            if (cost > upperBound) {
                anomalies.push({
                    type: 'IQR_HIGH',
                    meterId: reading.meterId,
                    meterName: reading.meter.meterName,
                    readingId: reading.id,
                    readingDate: reading.readingDate,
                    cost,
                    upperBound,
                    message: `Cost ${cost} exceeds upper bound ${upperBound.toFixed(2)}`
                });
            } else if (cost < lowerBound && cost > 0) {
                anomalies.push({
                    type: 'IQR_LOW',
                    meterId: reading.meterId,
                    meterName: reading.meter.meterName,
                    readingId: reading.id,
                    readingDate: reading.readingDate,
                    cost,
                    lowerBound,
                    message: `Cost ${cost} below lower bound ${lowerBound.toFixed(2)}`
                });
            }
        });

        // YoY/MoM Comparison
        if (meterReadings.length >= 2) {
            const latest = meterReadings[0];
            const previous = meterReadings[1];

            const latestUsage = Number(latest.usage);
            const previousUsage = Number(previous.usage);

            if (previousUsage > 0) {
                const changePercent = ((latestUsage - previousUsage) / previousUsage) * 100;

                if (Math.abs(changePercent) > 10) {
                    anomalies.push({
                        type: 'USAGE_FLUCTUATION',
                        meterId: latest.meterId,
                        meterName: latest.meter.meterName,
                        readingId: latest.id,
                        readingDate: latest.readingDate,
                        currentUsage: latestUsage,
                        previousUsage,
                        changePercent: changePercent.toFixed(2),
                        message: `Usage changed by ${changePercent.toFixed(1)}% from previous period`
                    });
                }
            }
        }
    }

    return { anomalies, totalReadings: readings.length };
};

// Area Compliance Check
export const checkAreaCompliance = async (dormId: string, standardPerPerson: number = 3.6) => {
    const rooms = await prisma.dormRoom.findMany({
        where: { dormitoryId: dormId },
        include: {
            beds: {
                include: {
                    worker: {
                        select: { id: true, englishName: true, chineseName: true }
                    }
                }
            }
        }
    });

    const violations: any[] = [];

    for (const room of rooms) {
        const occupiedBeds = room.beds.filter(b => b.worker !== null);
        const occupantCount = occupiedBeds.length;

        if (occupantCount === 0) continue;

        const roomArea = Number(room.area || 0);
        const areaPerPerson = roomArea / occupantCount;

        if (areaPerPerson < standardPerPerson) {
            violations.push({
                roomId: room.id,
                roomNumber: room.roomNumber,
                roomArea,
                occupantCount,
                areaPerPerson: areaPerPerson.toFixed(2),
                standard: standardPerPerson,
                deficit: (standardPerPerson - areaPerPerson).toFixed(2),
                occupants: occupiedBeds.map(b => ({
                    workerId: b.worker?.id,
                    name: b.worker?.chineseName || b.worker?.englishName
                }))
            });
        }
    }

    return {
        compliant: violations.length === 0,
        violations,
        standard: standardPerPerson,
        totalRoomsChecked: rooms.length
    };
};
