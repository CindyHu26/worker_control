/**
 * Alert Service - 異常儀表板邏輯
 * Phase 7.2: Smart Exception Dashboard
 */

import prisma from '../prisma';

// Define types locally until Prisma client is regenerated
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type CommentEntityType = 'WORKER' | 'EMPLOYER' | 'DEPLOYMENT' | 'JOB_ORDER' | 'LEAD';

export interface AlertSummary {
    critical: number;
    warning: number;
    info: number;
    total: number;
}

export interface AlertFilters {
    severity?: AlertSeverity;
    status?: AlertStatus;
    entityType?: CommentEntityType;
    limit?: number;
    offset?: number;
}

/**
 * 產生系統警示
 * 掃描移工資料，根據到期日產生對應等級的警示
 */
export async function generateAlerts(): Promise<number> {
    const now = new Date();
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    let alertsCreated = 0;

    // 1. 檢查居留證到期 (ARC Expiry)
    const workersWithExpiringArc = await prisma.worker.findMany({
        where: {
            isDeleted: false,
            residencePermitExpiry: {
                lte: oneMonthLater,
                gte: now,
            },
        },
        select: {
            id: true,
            englishName: true,
            chineseName: true,
            residencePermitExpiry: true,
        },
    });

    for (const worker of workersWithExpiringArc) {
        if (!worker.residencePermitExpiry) continue;

        const daysUntilExpiry = Math.ceil(
            (worker.residencePermitExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const severity: AlertSeverity = daysUntilExpiry <= 3 ? 'CRITICAL' : 'WARNING';
        const name = worker.chineseName || worker.englishName;

        // 檢查是否已存在相同警示
        const existing = await (prisma as any).systemAlert.findFirst({
            where: {
                entityType: 'WORKER',
                entityId: worker.id,
                alertType: 'ARC_EXPIRY',
                status: { not: 'RESOLVED' },
            },
        });

        if (!existing) {
            await (prisma as any).systemAlert.create({
                data: {
                    entityType: 'WORKER',
                    entityId: worker.id,
                    severity,
                    title: `居留證即將到期 - ${name}`,
                    description: `居留證將於 ${worker.residencePermitExpiry.toLocaleDateString('zh-TW')} 到期，剩餘 ${daysUntilExpiry} 天`,
                    dueDate: worker.residencePermitExpiry,
                    alertType: 'ARC_EXPIRY',
                },
            });
            alertsCreated++;
        }
    }

    // 2. 檢查護照到期 (Passport Expiry)
    const workersWithExpiringPassport = await prisma.worker.findMany({
        where: {
            isDeleted: false,
            passportExpiry: {
                lte: oneMonthLater,
                gte: now,
            },
        },
        select: {
            id: true,
            englishName: true,
            chineseName: true,
            passportExpiry: true,
        },
    });

    for (const worker of workersWithExpiringPassport) {
        if (!worker.passportExpiry) continue;

        const daysUntilExpiry = Math.ceil(
            (worker.passportExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const severity: AlertSeverity = daysUntilExpiry <= 3 ? 'CRITICAL' : 'WARNING';
        const name = worker.chineseName || worker.englishName;

        const existing = await (prisma as any).systemAlert.findFirst({
            where: {
                entityType: 'WORKER',
                entityId: worker.id,
                alertType: 'PASSPORT_EXPIRY',
                status: { not: 'RESOLVED' },
            },
        });

        if (!existing) {
            await (prisma as any).systemAlert.create({
                data: {
                    entityType: 'WORKER',
                    entityId: worker.id,
                    severity,
                    title: `護照即將到期 - ${name}`,
                    description: `護照將於 ${worker.passportExpiry.toLocaleDateString('zh-TW')} 到期，剩餘 ${daysUntilExpiry} 天`,
                    dueDate: worker.passportExpiry,
                    alertType: 'PASSPORT_EXPIRY',
                },
            });
            alertsCreated++;
        }
    }

    // 3. 檢查體檢到期 (Health Check Deadlines)
    const healthCheckFields = [
        { field: 'medCheck6moDeadline', type: 'HEALTH_CHECK_6MO', label: '6個月體檢' },
        { field: 'medCheck18moDeadline', type: 'HEALTH_CHECK_18MO', label: '18個月體檢' },
        { field: 'medCheck30moDeadline', type: 'HEALTH_CHECK_30MO', label: '30個月體檢' },
    ];

    for (const hc of healthCheckFields) {
        const workers = await prisma.worker.findMany({
            where: {
                isDeleted: false,
                [hc.field]: {
                    lte: oneMonthLater,
                    gte: now,
                },
            },
            select: {
                id: true,
                englishName: true,
                chineseName: true,
                [hc.field]: true,
            },
        });

        for (const worker of workers) {
            const deadline = (worker as any)[hc.field] as Date | null;
            if (!deadline) continue;

            const daysUntilDeadline = Math.ceil(
                (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            const severity: AlertSeverity = daysUntilDeadline <= 3 ? 'CRITICAL' : 'WARNING';
            const name = worker.chineseName || worker.englishName;

            const existing = await (prisma as any).systemAlert.findFirst({
                where: {
                    entityType: 'WORKER',
                    entityId: worker.id,
                    alertType: hc.type,
                    status: { not: 'RESOLVED' },
                },
            });

            if (!existing) {
                await (prisma as any).systemAlert.create({
                    data: {
                        entityType: 'WORKER',
                        entityId: worker.id,
                        severity,
                        title: `${hc.label}即將到期 - ${name}`,
                        description: `${hc.label}期限將於 ${deadline.toLocaleDateString('zh-TW')} 到期，剩餘 ${daysUntilDeadline} 天`,
                        dueDate: deadline,
                        alertType: hc.type,
                    },
                });
                alertsCreated++;
            }
        }
    }

    // 4. 檢查入國通報逾期 (Entry Report Overdue)
    const overdueEntryFilings = await prisma.entryFiling.findMany({
        where: {
            entryReportStatus: 'PENDING',
            entryDate: {
                lte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            },
        },
        include: {
            worker: {
                select: {
                    id: true,
                    englishName: true,
                    chineseName: true,
                },
            },
        },
    });

    for (const filing of overdueEntryFilings) {
        const name = filing.worker.chineseName || filing.worker.englishName;

        const existing = await (prisma as any).systemAlert.findFirst({
            where: {
                entityType: 'WORKER',
                entityId: filing.workerId,
                alertType: 'ENTRY_REPORT_OVERDUE',
                status: { not: 'RESOLVED' },
            },
        });

        if (!existing) {
            await (prisma as any).systemAlert.create({
                data: {
                    entityType: 'WORKER',
                    entityId: filing.workerId,
                    severity: 'CRITICAL',
                    title: `入國通報逾期 - ${name}`,
                    description: `入境日期: ${filing.entryDate.toLocaleDateString('zh-TW')}，已超過法定 3 日通報期限`,
                    dueDate: filing.entryDate,
                    alertType: 'ENTRY_REPORT_OVERDUE',
                },
            });
            alertsCreated++;
        }
    }

    return alertsCreated;
}

/**
 * 取得警示列表 (支援篩選)
 */
export async function getAlerts(filters: AlertFilters = {}) {
    const { severity, status, entityType, limit = 50, offset = 0 } = filters;

    const where: Record<string, unknown> = {};

    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;

    const [alerts, total] = await Promise.all([
        (prisma as any).systemAlert.findMany({
            where,
            orderBy: [
                { severity: 'asc' }, // CRITICAL first
                { dueDate: 'asc' },
            ],
            take: limit,
            skip: offset,
        }),
        (prisma as any).systemAlert.count({ where }),
    ]);

    return { alerts, total };
}

/**
 * 取得警示統計
 */
export async function getAlertSummary(): Promise<AlertSummary> {
    const [critical, warning, info] = await Promise.all([
        (prisma as any).systemAlert.count({
            where: { severity: 'CRITICAL', status: 'OPEN' },
        }),
        (prisma as any).systemAlert.count({
            where: { severity: 'WARNING', status: 'OPEN' },
        }),
        (prisma as any).systemAlert.count({
            where: { severity: 'INFO', status: 'OPEN' },
        }),
    ]);

    return {
        critical,
        warning,
        info,
        total: critical + warning + info,
    };
}

/**
 * 確認警示 (Acknowledge)
 */
export async function acknowledgeAlert(alertId: string, userId: string) {
    const alert = await (prisma as any).systemAlert.update({
        where: { id: alertId },
        data: {
            status: 'ACKNOWLEDGED',
            acknowledgedBy: userId,
            acknowledgedAt: new Date(),
        },
    });

    return alert;
}

/**
 * 解決警示 (Resolve)
 */
export async function resolveAlert(alertId: string) {
    const alert = await (prisma as any).systemAlert.update({
        where: { id: alertId },
        data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
        },
    });

    return alert;
}

/**
 * 取得單一警示
 */
export async function getAlertById(alertId: string) {
    return (prisma as any).systemAlert.findUnique({
        where: { id: alertId },
    });
}

/**
 * 依據實體取得警示
 */
export async function getAlertsByEntity(entityType: CommentEntityType, entityId: string) {
    return (prisma as any).systemAlert.findMany({
        where: {
            entityType,
            entityId,
            status: { not: 'RESOLVED' },
        },
        orderBy: { severity: 'asc' },
    });
}
