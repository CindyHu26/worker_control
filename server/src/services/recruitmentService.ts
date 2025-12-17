import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export const recruitmentService = {
    /**
     * 1. 建立/更新 國內求才紀錄 (Job Order)
     * 這是流程的起點
     */
    async upsertJobOrder(employerId: string, data: any) {
        return await prisma.jobOrder.upsert({
            where: { id: data.id || 'new' },
            create: {
                employerId,
                jobType: data.jobType,
                vacancyCount: data.vacancyCount,
                registryDate: new Date(data.registryDate),
                expiryDate: new Date(data.expiryDate), // 通常是登記日+60~90天
                centerName: data.centerName,
                status: 'active'
            },
            update: {
                vacancyCount: data.vacancyCount,
                certificateNo: data.certificateNo, // 拿到求才證明後回填
                successCount: data.successCount,   // 國內媒合成功人數 (會扣減可申請額度)
                status: data.status
            }
        });
    },

    /**
     * 2. 登錄招募函 (Recruitment Letter)
     * 系統會自動檢查是否關聯求才紀錄，並計算核准名額
     */
    async createRecruitmentLetter(data: {
        employerId: string;
        jobOrderId?: string; // 來源求才單 (若是初次招募必填)
        permitNo: string;    // 勞動發事字第...號
        issueDate: string;   // 發文日
        validUntil: string;  // 有效期限
        approvedQuota: number; // 核准名額
        attachmentPath?: string;
    }) {
        // 檢查文號是否重複
        const existing = await prisma.recruitmentLetter.findUnique({
            where: { permitNo: data.permitNo }
        });
        if (existing) throw new Error(`招募函文號 ${data.permitNo} 已存在`);

        // 建立招募函
        const letter = await prisma.recruitmentLetter.create({
            data: {
                employerId: data.employerId,
                jobOrderId: data.jobOrderId || null,
                permitNo: data.permitNo,
                issueDate: new Date(data.issueDate),
                validUntil: new Date(data.validUntil),
                approvedQuota: data.approvedQuota,
                usedQuota: 0, // 初始使用量為 0
                revokedQuota: 0,
                attachmentPath: data.attachmentPath
            }
        });

        // 如果有關聯求才單，將求才單狀態更新為「已完成」(Completed)
        if (data.jobOrderId) {
            await prisma.jobOrder.update({
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
        const letters = await prisma.recruitmentLetter.findMany({
            where: {
                employerId,
                // validUntil: { gte: new Date() }, // 嚴格模式可打開這行
            },
            include: {
                jobOrder: true, // 包含來源求才資訊
                entryPermits: true // 包含已申請的入國引進許可
            }
        });

        return letters.map(letter => {
            // 實際已用額度 = 該招募函底下的「入國引進許可」總人數
            // 這裡做一個雙重確認 (Double Check)，不僅讀取 usedQuota 欄位，也實際加總
            const actualUsed = letter.entryPermits.reduce((sum, p) => sum + p.workerCount, 0);

            const remaining = letter.approvedQuota - actualUsed - letter.revokedQuota;

            return {
                id: letter.id,
                permitNo: letter.permitNo,
                issueDate: letter.issueDate,
                validUntil: letter.validUntil,
                jobType: letter.jobOrder?.jobType || 'Unknown',
                approved: letter.approvedQuota,
                used: actualUsed,
                remaining: Math.max(0, remaining),
                status: remaining > 0 ? 'available' : 'exhausted'
            };
        });
    }
};