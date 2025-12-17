import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export type PermitType = 'INITIAL' | 'EXTENSION' | 'REISSUE';

interface CreatePermitInput {
    deploymentId: string;
    permitNumber: string;
    issueDate: Date | string;
    expiryDate: Date | string;
    type: PermitType;
    // 申請相關資訊 (M343)
    receiptNumber?: string;
    applicationDate?: Date | string;
    feeAmount?: number;
}

export const permitService = {
    /**
     * 創建聘僱許可 (包含初次、展延、補發)
     * 會自動處理舊許可的狀態與法規檢核
     */
    async createPermit(data: CreatePermitInput) {
        return await prisma.$transaction(async (tx) => {
            const { deploymentId, type, issueDate, expiryDate, permitNumber } = data;

            // 1. 取得派遣與相關文件資訊
            const deployment = await tx.deployment.findUnique({
                where: { id: deploymentId },
                include: {
                    entryPermit: {
                        include: { recruitmentLetter: true }
                    },
                    employmentPermits: {
                        where: { status: 'ACTIVE' } // 找目前生效的
                    }
                }
            });

            if (!deployment) throw new Error("Deployment not found");

            // 2. 依照類型進行法規邏輯檢查
            if (type === 'INITIAL') {
                // [法規檢查] 初次聘僱許可，通常需對應有效的「入國引進許可」
                // 若是國內承接 (Transfer)，則可能沒有 EntryPermit，這邊做彈性檢查
                if (deployment.sourceType !== 'transfer' && !deployment.entryPermit) {
                    throw new Error("違反法規流程：初次聘僱許可 (Initial) 必須關聯「入國引進許可 (Entry Permit)」。請先建立入國引進許可資料。");
                }

                // 檢查是否已存在有效許可 (避免重複建檔)
                if (deployment.employmentPermits.length > 0) {
                    throw new Error("此案件已有生效中的聘僱許可，無法重複建立初次許可。若為續聘請選擇「展延」。");
                }
            } else if (type === 'EXTENSION') {
                // [法規檢查] 展延必須基於上一張許可
                const activePermit = deployment.employmentPermits[0];
                if (!activePermit) {
                    throw new Error("找不到上一張有效許可，無法辦理「展延」。請確認是否有初次許可資料。");
                }

                // 將舊許可標示為過期 (EXPIRED) 或 歸檔 (ARCHIVED)
                await tx.employmentPermit.update({
                    where: { id: activePermit.id },
                    data: { status: 'EXPIRED' }
                });
            }

            // 3. 建立新許可
            const newPermit = await tx.employmentPermit.create({
                data: {
                    deploymentId,
                    permitNumber,
                    issueDate: new Date(issueDate),
                    expiryDate: new Date(expiryDate),
                    type,
                    status: 'ACTIVE',
                    receiptNumber: data.receiptNumber,
                    applicationDate: data.applicationDate ? new Date(data.applicationDate) : undefined,
                    feeAmount: data.feeAmount || 0
                }
            });

            // 4. (選用) 若是初次許可，可回寫 permitNumber 到 Deployment 的快取欄位 (若您有保留該欄位)
            // 或是更新 Deployment 狀態為 'authorized'

            return newPermit;
        });
    },

    /**
     * 取得該派遣的所有許可紀錄 (含歷史)
     */
    async getPermitHistory(deploymentId: string) {
        return await prisma.employmentPermit.findMany({
            where: { deploymentId },
            orderBy: { issueDate: 'desc' }
        });
    },

    /**
     * 檢查許可健康度 (提醒展延)
     * 用於 Dashboard 通知
     */
    async checkPermitExpiry(deploymentId: string) {
        const activePermit = await prisma.employmentPermit.findFirst({
            where: { deploymentId, status: 'ACTIVE' }
        });

        if (!activePermit) return { status: 'NO_PERMIT' };

        const daysUntilExpiry = Math.ceil((activePermit.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        // 法規：屆滿前 4 個月內可申請展延
        const canExtend = daysUntilExpiry <= 120 && daysUntilExpiry > 0;
        const isUrgent = daysUntilExpiry <= 30; // 30天內緊急
        const isExpired = daysUntilExpiry <= 0;

        return {
            permitNumber: activePermit.permitNumber,
            expiryDate: activePermit.expiryDate,
            daysUntilExpiry,
            canExtend,
            isUrgent,
            isExpired
        };
    }
};