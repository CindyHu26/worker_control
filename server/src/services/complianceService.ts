import prisma from '../prisma';

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
    // 1. Fetch Dorm Data and Compliance Rules in parallel
    const [dorm, areaRule, safetyRule] = await Promise.all([
        prisma.dormitory.findUnique({
            where: { id: dormId },
            include: { rooms: true }
        }),
        prisma.complianceRule.findUnique({ where: { code: 'DORM_MIN_AREA_PER_PERSON' } }),
        prisma.complianceRule.findUnique({ where: { code: 'FIRE_SAFETY_WARNING_DAYS' } })
    ]);

    if (!dorm) throw new Error("Dormitory not found");

    // Parse rules with fallbacks
    const MIN_AREA_PER_PERSON = areaRule ? parseFloat(areaRule.value) : 3.6;
    const FIRE_SAFETY_WARNING_DAYS = safetyRule ? parseInt(safetyRule.value) : 30;

    if (!areaRule) console.warn('[Compliance] Missing rule DORM_MIN_AREA_PER_PERSON, using default:', MIN_AREA_PER_PERSON);
    if (!safetyRule) console.warn('[Compliance] Missing rule FIRE_SAFETY_WARNING_DAYS, using default:', FIRE_SAFETY_WARNING_DAYS);

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

            // Check against dynamic rule
            if (areaPerPerson < MIN_AREA_PER_PERSON) {
                violations.push({
                    roomId: room.roomNumber,
                    type: 'DENSITY_TOO_HIGH',
                    message: `房號 ${room.roomNumber}: 人均僅 ${areaPerPerson.toFixed(1)}m² (標準: ${MIN_AREA_PER_PERSON}m²)`
                });
                if (!hasDensityViolation) {
                    score -= 20;
                    actionItems.push(`存在房間人均面積不足 (過度擁擠)，請減少床位或擴大面積 (標準: ${MIN_AREA_PER_PERSON}m²)`);
                    hasDensityViolation = true;
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
        } else if (daysToExpiry < FIRE_SAFETY_WARNING_DAYS) {
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
