import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { differenceInDays } from 'date-fns';

// 合規狀態
export const COMPLIANCE_STATUS = {
    PENDING: 'PENDING',       // 尚未完成
    COMPLIANT: 'COMPLIANT',   // 合規
    OVERDUE: 'OVERDUE',       // 逾期
    WARNING: 'WARNING',       // 即將到期
} as const;

// 申報項目狀態
export const FILING_STATUS = {
    PENDING: 'PENDING',
    SUBMITTED: 'SUBMITTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
} as const;

export const entryFilingService = {
    /**
     * 取得移工入境申報
     */
    async getFilingByWorkerId(workerId: string) {
        return prisma.entryFiling.findUnique({
            where: { workerId },
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
    },

    /**
     * 建立或更新入境申報
     */
    async upsertFiling(
        workerId: string,
        data: Omit<Prisma.EntryFilingUncheckedCreateInput, 'id' | 'workerId' | 'createdAt' | 'updatedAt' | 'overallCompliance'>
    ) {
        // 計算各項合規狀態
        const entryDate = new Date(data.entryDate);
        const today = new Date();
        const daysSinceEntry = differenceInDays(today, entryDate);

        // 計算入國通報狀態 (3日內)
        const entryReportStatus = this.calculateItemStatus(
            data.entryReportDate as Date | null,
            data.entryReportRefNo as string | null,
            null,
            daysSinceEntry,
            3
        );

        // 計算入境健檢狀態 (3日內)
        const initialExamStatus = data.initialExamResult ? 'COMPLIANT' :
            (daysSinceEntry > 3 ? 'OVERDUE' : 'PENDING');

        // 計算居留證申請狀態 (15日內)
        const arcStatus = this.calculateItemStatus(
            data.arcApplyDate as Date | null,
            data.arcReceiptNo as string | null,
            data.arcNo as string | null,
            daysSinceEntry,
            15
        );

        // 計算聘僱許可申請狀態 (15日內)
        const permitStatus = this.calculateItemStatus(
            data.permitApplyDate as Date | null,
            data.permitReceiptNo as string | null,
            data.permitNo as string | null,
            daysSinceEntry,
            15
        );

        // 計算整體合規狀態
        const overallCompliance = this.calculateOverallCompliance([
            entryReportStatus,
            initialExamStatus,
            arcStatus,
            permitStatus,
        ]);

        return prisma.entryFiling.upsert({
            where: { workerId },
            create: {
                workerId,
                ...data,
                entryReportStatus,
                arcStatus,
                permitStatus,
                overallCompliance,
            },
            update: {
                ...data,
                entryReportStatus,
                arcStatus,
                permitStatus,
                overallCompliance,
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
    },

    /**
     * 結果導向驗證：計算單項申報狀態
     * 若已有「收文號」或「證號」，即便「送件日」為空，系統判定為合規
     */
    calculateItemStatus(
        submitDate: Date | null,
        receiptNo: string | null,
        certNo: string | null,
        daysSinceEntry: number,
        deadlineDays: number
    ): string {
        // 結果導向：有收文號或證號 = 合規
        if (certNo || receiptNo) {
            return COMPLIANCE_STATUS.COMPLIANT;
        }

        // 有送件日 = 已送件
        if (submitDate) {
            return FILING_STATUS.SUBMITTED;
        }

        // 逾期判定
        if (daysSinceEntry > deadlineDays) {
            return COMPLIANCE_STATUS.OVERDUE;
        }

        // 即將到期警告 (剩餘 1天)
        if (daysSinceEntry >= deadlineDays - 1) {
            return COMPLIANCE_STATUS.WARNING;
        }

        return COMPLIANCE_STATUS.PENDING;
    },

    /**
     * 計算整體合規狀態
     */
    calculateOverallCompliance(statuses: string[]): string {
        if (statuses.includes(COMPLIANCE_STATUS.OVERDUE)) {
            return COMPLIANCE_STATUS.OVERDUE;
        }
        if (statuses.includes(COMPLIANCE_STATUS.WARNING)) {
            return COMPLIANCE_STATUS.WARNING;
        }
        if (statuses.every(s => s === COMPLIANCE_STATUS.COMPLIANT || s === FILING_STATUS.APPROVED)) {
            return COMPLIANCE_STATUS.COMPLIANT;
        }
        return COMPLIANCE_STATUS.PENDING;
    },

    /**
     * 取得合規儀表板統計
     */
    async getComplianceDashboard() {
        const [total, compliant, overdue, pending] = await Promise.all([
            prisma.entryFiling.count(),
            prisma.entryFiling.count({ where: { overallCompliance: 'COMPLIANT' } }),
            prisma.entryFiling.count({ where: { overallCompliance: 'OVERDUE' } }),
            prisma.entryFiling.count({ where: { overallCompliance: 'PENDING' } }),
        ]);

        return {
            total,
            compliant,
            overdue,
            pending,
            complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
        };
    },

    /**
     * 列表 (分頁 + 篩選)
     */
    async listFilings(params: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) {
        const { page = 1, limit = 20, status, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.EntryFilingWhereInput = {};

        if (status) {
            where.overallCompliance = status;
        }

        if (search) {
            where.worker = {
                OR: [
                    { englishName: { contains: search, mode: 'insensitive' } },
                    { chineseName: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [data, total] = await Promise.all([
            prisma.entryFiling.findMany({
                where,
                skip,
                take: limit,
                orderBy: { entryDate: 'desc' },
                include: {
                    worker: {
                        select: {
                            id: true,
                            englishName: true,
                            chineseName: true,
                        },
                    },
                },
            }),
            prisma.entryFiling.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
};
