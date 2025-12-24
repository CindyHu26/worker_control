import prisma from '../prisma';
import { Prisma } from '@prisma/client';

// 治療狀態
export const TREATMENT_STATUS = {
    PENDING: 'PENDING',           // 待處理
    IN_TREATMENT: 'IN_TREATMENT', // 治療中
    RECOVERED: 'RECOVERED',       // 已痊癒
    DEPORTED: 'DEPORTED',         // 已遣返
} as const;

// 常見法定傳染病
export const DISEASE_TYPES = {
    TB: '肺結核',
    AMOEBIASIS: '阿米巴痢疾',
    SYPHILIS: '梅毒',
    HIV: 'HIV/愛滋病',
    HEPATITIS_B: 'B型肝炎',
    OTHER: '其他',
} as const;

export const medicalExceptionService = {
    /**
     * 建立異常通報
     */
    async createException(data: Prisma.MedicalExceptionUncheckedCreateInput) {
        return prisma.medicalException.create({
            data,
            include: {
                worker: {
                    select: {
                        id: true,
                        englishName: true,
                        chineseName: true,
                    },
                },
                healthCheck: true,
            },
        });
    },

    /**
     * 更新異常通報
     */
    async updateException(id: string, data: Partial<Prisma.MedicalExceptionUncheckedUpdateInput>) {
        return prisma.medicalException.update({
            where: { id },
            data,
            include: {
                worker: {
                    select: {
                        id: true,
                        englishName: true,
                        chineseName: true,
                    },
                },
                healthCheck: true,
            },
        });
    },

    /**
     * 列表 (分頁 + 篩選)
     */
    async listExceptions(params: {
        page?: number;
        limit?: number;
        status?: string;
        diseaseType?: string;
        search?: string;
    }) {
        const { page = 1, limit = 20, status, diseaseType, search } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.MedicalExceptionWhereInput = {};

        if (status) {
            where.treatmentStatus = status;
        }

        if (diseaseType) {
            where.diseaseType = diseaseType;
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
            prisma.medicalException.findMany({
                where,
                skip,
                take: limit,
                orderBy: { diagnosisDate: 'desc' },
                include: {
                    worker: {
                        select: {
                            id: true,
                            englishName: true,
                            chineseName: true,
                        },
                    },
                    healthCheck: true,
                },
            }),
            prisma.medicalException.count({ where }),
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
     * 取得單筆異常通報
     */
    async getExceptionById(id: string) {
        return prisma.medicalException.findUnique({
            where: { id },
            include: {
                worker: {
                    select: {
                        id: true,
                        englishName: true,
                        chineseName: true,
                    },
                },
                healthCheck: true,
            },
        });
    },

    /**
     * 標記衛生局已通報
     */
    async markHealthDeptNotified(id: string) {
        return this.updateException(id, {
            healthDeptNotified: true,
            healthDeptNotifyDate: new Date(),
        });
    },

    /**
     * 標記雇主已通知
     */
    async markEmployerNotified(id: string) {
        return this.updateException(id, {
            employerNotified: true,
            employerNotifyDate: new Date(),
        });
    },

    /**
     * 統計儀表板
     */
    async getDashboard() {
        const [total, pending, inTreatment, recovered, deported] = await Promise.all([
            prisma.medicalException.count(),
            prisma.medicalException.count({ where: { treatmentStatus: 'PENDING' } }),
            prisma.medicalException.count({ where: { treatmentStatus: 'IN_TREATMENT' } }),
            prisma.medicalException.count({ where: { treatmentStatus: 'RECOVERED' } }),
            prisma.medicalException.count({ where: { treatmentStatus: 'DEPORTED' } }),
        ]);

        return {
            total,
            pending,
            inTreatment,
            recovered,
            deported,
        };
    },
};
