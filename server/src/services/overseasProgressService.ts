import prisma from '../prisma';
import { Prisma } from '@prisma/client';
import { differenceInMonths } from 'date-fns';

// 進度狀態
export const PROGRESS_STATUS = {
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    BLOCKED: 'BLOCKED',
} as const;

// 體檢結果
export const MEDICAL_RESULT = {
    PASS: 'PASS',
    FAIL: 'FAIL',
    PENDING: 'PENDING',
} as const;

// 良民證狀態
export const POLICE_CLR_STATUS = {
    ISSUED: 'ISSUED',
    PENDING: 'PENDING',
    REJECTED: 'REJECTED',
} as const;

export const overseasProgressService = {
    /**
     * 取得候選人海外進度
     */
    async getProgressByCandidateId(candidateId: string) {
        return prisma.overseasProgress.findUnique({
            where: { candidateId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        nameZh: true,
                        nameEn: true,
                        passportNo: true,
                        passportExpiry: true,
                        nationality: true,
                    },
                },
            },
        });
    },

    /**
     * 建立或更新海外進度
     */
    async upsertProgress(
        candidateId: string,
        data: Omit<Prisma.OverseasProgressUncheckedCreateInput, 'id' | 'candidateId' | 'createdAt' | 'updatedAt'>
    ) {
        // 取得候選人來檢查護照效期
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId },
            select: { passportExpiry: true },
        });

        // 自動計算護照效期是否 > 6個月
        let passportExpiryOk = data.passportExpiryOk;
        if (data.passportChecked && candidate?.passportExpiry) {
            const monthsUntilExpiry = differenceInMonths(candidate.passportExpiry, new Date());
            passportExpiryOk = monthsUntilExpiry > 6;
        }

        // 計算整體狀態
        const overallStatus = this.calculateOverallStatus({
            medicalExamResult: data.medicalExamResult as string | null,
            policeClrStatus: data.policeClrStatus as string | null,
            passportExpiryOk,
            arcHasIssues: data.arcHasIssues,
        });

        return prisma.overseasProgress.upsert({
            where: { candidateId },
            create: {
                candidateId,
                ...data,
                passportExpiryOk,
                overallStatus,
            },
            update: {
                ...data,
                passportExpiryOk,
                overallStatus,
            },
            include: {
                candidate: {
                    select: {
                        id: true,
                        nameZh: true,
                        nameEn: true,
                        passportNo: true,
                    },
                },
            },
        });
    },

    /**
     * 計算整體狀態
     */
    calculateOverallStatus(data: {
        medicalExamResult: string | null | undefined;
        policeClrStatus: string | null | undefined;
        passportExpiryOk: boolean | null | undefined;
        arcHasIssues: boolean | null | undefined;
    }): string {
        // 有任何阻擋項目
        if (
            data.medicalExamResult === 'FAIL' ||
            data.policeClrStatus === 'REJECTED' ||
            data.passportExpiryOk === false ||
            data.arcHasIssues === true
        ) {
            return PROGRESS_STATUS.BLOCKED;
        }

        // 全部完成
        if (
            data.medicalExamResult === 'PASS' &&
            data.policeClrStatus === 'ISSUED' &&
            data.passportExpiryOk === true
        ) {
            return PROGRESS_STATUS.COMPLETED;
        }

        return PROGRESS_STATUS.IN_PROGRESS;
    },

    /**
     * 分頁列表
     */
    async listAllProgress(params: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) {
        const { page = 1, limit = 20, status, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.OverseasProgressWhereInput = {};

        if (status) {
            where.overallStatus = status;
        }

        if (search) {
            where.candidate = {
                OR: [
                    { nameZh: { contains: search, mode: 'insensitive' } },
                    { nameEn: { contains: search, mode: 'insensitive' } },
                    { passportNo: { contains: search, mode: 'insensitive' } },
                ],
            };
        }

        const [data, total] = await Promise.all([
            prisma.overseasProgress.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updatedAt: 'desc' },
                include: {
                    candidate: {
                        select: {
                            id: true,
                            nameZh: true,
                            nameEn: true,
                            passportNo: true,
                            nationality: true,
                            passportExpiry: true,
                        },
                    },
                },
            }),
            prisma.overseasProgress.count({ where }),
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

    /**
     * 產生進度報告 (雇主回報用)
     */
    async generateProgressReport(candidateId: string) {
        const progress = await this.getProgressByCandidateId(candidateId);

        if (!progress) {
            throw new Error('找不到該候選人的海外進度記錄');
        }

        const checkpoints = [
            {
                name: '海外體檢',
                status: progress.medicalExamResult || '尚未完成',
                date: progress.medicalExamDate,
                remarks: progress.medicalExamRemarks,
            },
            {
                name: '良民證',
                status: progress.policeClrStatus || '尚未申請',
                date: progress.policeClrDate,
                remarks: progress.policeClrRemarks,
            },
            {
                name: '護照效期檢查',
                status: progress.passportChecked
                    ? progress.passportExpiryOk
                        ? '合格 (>6個月)'
                        : '不合格 (<6個月)'
                    : '尚未檢查',
                remarks: progress.passportRemarks,
            },
            {
                name: '舊居留證檢查',
                status: progress.arcChecked
                    ? progress.arcHasIssues
                        ? '有問題 (逾期/欠稅)'
                        : '無問題'
                    : '尚未檢查',
                remarks: progress.arcRemarks,
            },
        ];

        return {
            candidate: progress.candidate,
            overallStatus: progress.overallStatus,
            checkpoints,
            generatedAt: new Date(),
        };
    },
};
