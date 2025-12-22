
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface HealthResult {
    score: number;
    status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    missingFields: string[];
    violations: Array<{
        roomId?: string; // Optional if it's a dorm-level violation
        type: string;
        message: string;
    }>;
    actionItems: string[];
}

export const analyzeDormHealth = async (dormId: string): Promise<HealthResult> => {
    // 1. Fetch Dorm Data with Rooms
    const dorm = await prisma.dormitory.findUnique({
        where: { id: dormId },
        include: { rooms: true }
    });

    if (!dorm) throw new Error("Dormitory not found");

    const missingFields: string[] = [];
    const violations: any[] = [];
    const actionItems: string[] = [];
    let score = 100;

    // 2. Check Critical Missing Fields (Dorm Level)
    if (!dorm.totalArea) {
        missingFields.push('totalArea');
        score -= 20;
        actionItems.push('請補填宿舍總面積 (Total Area)');
    }
    if (!dorm.fireSafetyExpiry) {
        missingFields.push('fireSafetyExpiry');
        score -= 20;
        actionItems.push('請補填消防安檢到期日 (Fire Safety Expiry)');
    }

    // 3. Check Critical Missing Fields (Room Level) & Density
    let hasRoomAreaMissing = false;
    let hasDensityViolation = false;

    for (const r of dorm.rooms) {
        const room: any = r;
        // Missing Area
        if (!room.area) {
            if (!hasRoomAreaMissing) { // Group into one message
                missingFields.push('Room Areas');
                score -= 15;
                actionItems.push('部分房間缺少面積資料，請補填');
                hasRoomAreaMissing = true;
            }
        }

        // Density Violation (Requires Area & Capacity)
        if (room.area && room.capacity > 0) {
            const areaPerPerson = Number(room.area) / room.capacity;
            if (areaPerPerson < 3.2) { // Legal is 3.6, but maybe warn at 3.2? prompt said < 3.6 is VIOLATION.
                // Strict check < 3.6
                if (areaPerPerson < 3.6) {
                    violations.push({
                        roomId: room.roomNumber,
                        type: 'DENSITY_TOO_HIGH',
                        message: `房號 ${room.roomNumber}: 人均僅 ${areaPerPerson.toFixed(1)}m² (標準: 3.6m²)`
                    });
                    if (!hasDensityViolation) {
                        score -= 20;
                        actionItems.push('存在房間人均面積不足 (過度擁擠)，請減少床位或擴大面積');
                        hasDensityViolation = true;
                    }
                }
            }
        }
    }

    // 4. Check Expiry (Warning Level)
    if (dorm.fireSafetyExpiry) {
        const daysToExpiry = Math.ceil((new Date(dorm.fireSafetyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysToExpiry < 0) {
            violations.push({ type: 'EXPIRED', message: '消防安檢已過期！' });
            score -= 30; // Critical hit
            actionItems.push('消防安檢已過期，請盡速申報');
        } else if (daysToExpiry < 30) {
            violations.push({ type: 'EXPIRING_SOON', message: `消防安檢將於 ${daysToExpiry} 天後到期` });
            score -= 5;
            actionItems.push('請安排消防安檢申報');
        }
    }

    // 5. Determine Status
    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (score < 60 || violations.some(v => v.type === 'EXPIRED')) status = 'CRITICAL';
    else if (score < 90 || missingFields.length > 0) status = 'WARNING'; // Any missing field is at least a warning

    // Cap score at 0
    score = Math.max(0, score);

    return {
        score,
        status,
        missingFields,
        violations,
        actionItems
    };
};
