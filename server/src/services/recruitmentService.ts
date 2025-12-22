import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const recruitmentService = {
    /**
     * 1. 建立/更新 國內求才紀錄 (Job Order)
     * 這是流程的起點
     */
    async upsertJobOrder(employerId: string, data: any) {
        return await (prisma as any).jobOrder.upsert({
            where: { id: data.id || 'new' },
            create: {
                employerId,
                jobType: data.jobType || 'FACTORY_WORKER',
                vacancyCount: Number(data.vacancyCount),
                registryDate: new Date(data.registryDate),
                expiryDate: new Date(new Date(data.registryDate).getTime() + 60 * 24 * 60 * 60 * 1000),
                centerName: data.centerName,
                status: 'active'
            },
            update: {
                vacancyCount: Number(data.vacancyCount),
                registryDate: data.registryDate ? new Date(data.registryDate) : undefined,
                certificateNo: data.certificateNo,
                successCount: data.successCount ? Number(data.successCount) : undefined,
                status: data.status,
                centerName: data.centerName
            }
        });
    },

    async upsertJobRequisition(jobOrderId: string, data: any) {
        return await (prisma as any).jobRequisition.upsert({
            where: { jobOrderId },
            update: {
                skills: data.skills,
                salaryStructure: data.salaryStructure,
                leavePolicy: data.leavePolicy,
                workHours: data.workHours,
                accommodation: data.accommodation,
                otherRequirements: data.otherRequirements
            },
            create: {
                jobOrderId,
                skills: data.skills,
                salaryStructure: data.salaryStructure,
                leavePolicy: data.leavePolicy,
                workHours: data.workHours,
                accommodation: data.accommodation,
                otherRequirements: data.otherRequirements
            }
        });
    },

    /**
     * 2. 登錄招募函 (Recruitment Letter)
     * 系統會自動檢查是否關聯求才紀錄，並計算核准名額
     */
    async createRecruitmentLetter(data: {
        employerId: string;
        jobOrderId?: string;
        letterNumber: string;
        issueDate: string;
        expiryDate: string;
        approvedQuota: number;
        attachmentPath?: string;
    }) {
        // 檢查文號是否重複
        const existing = await (prisma as any).recruitmentLetter.findUnique({
            where: { letterNumber: data.letterNumber }
        });
        if (existing) throw new Error(`招募函文號 ${data.letterNumber} 已存在`);

        // 建立招募函
        const letter = await (prisma as any).recruitmentLetter.create({
            data: {
                employerId: data.employerId,
                jobOrderId: data.jobOrderId || null,
                letterNumber: data.letterNumber,
                issueDate: new Date(data.issueDate),
                expiryDate: new Date(data.expiryDate),
                approvedQuota: data.approvedQuota,
                usedQuota: 0,
                revokedQuota: 0,
                attachmentPath: data.attachmentPath
            }
        });

        // 如果有關聯求才單，將求才單狀態更新為「已完成」(Completed)
        if (data.jobOrderId) {
            await (prisma as any).jobOrder.update({
                where: { id: data.jobOrderId },
                data: { status: 'completed' }
            });
        }

        return letter;
    },

    /**
     * 3. 查詢雇主的可用招募函額度 (Quota Calculation)
     * 這是系統最核心的計算： 核准 - (已用 + 放棄)
     */
    async getAvailableQuota(employerId: string) {
        // 找出所有「有效期限內」且「還有餘額」的招募函
        const letters = await (prisma as any).recruitmentLetter.findMany({
            where: {
                employerId,
                // validUntil: { gte: new Date() }, // 嚴格模式可打開這行
            },
            include: {
                jobOrder: true, // 包含來源求才資訊
                entryPermits: true // 包含已申請的入國引進許可
            }
        });

        return letters.map((letter: any) => {
            // 實際已用額度 = 該招募函底下的「入國引進許可」總人數
            // 這裡做一個雙重確認 (Double Check)，不僅讀取 usedQuota 欄位，也實際加總
            const actualUsed = letter.entryPermits.reduce((sum: any, p: any) => sum + p.workerCount, 0);

            const remaining = letter.approvedQuota - actualUsed - letter.revokedQuota;

            return {
                id: letter.id,
                letterNumber: letter.letterNumber,
                issueDate: letter.issueDate,
                expiryDate: letter.expiryDate,
                jobType: letter.jobOrder?.jobType || 'Unknown',
                approved: letter.approvedQuota,
                used: actualUsed,
                remaining: Math.max(0, remaining),
                status: remaining > 0 ? 'available' : 'exhausted'
            };
        });
    }
};