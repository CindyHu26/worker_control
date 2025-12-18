import { z } from 'zod';
import prisma from '../prisma';

// 定義結構，確保 JSON 裡面不會被亂存垃圾
// Define schemas for industry-specific attributes
const FactoryAttrs = z.object({
    factoryRegistrationNo: z.string().optional(),
    industryCode: z.string().optional(),
    industryType: z.string().optional(),
    factoryAddress: z.string().optional(),
    factoryAddressEn: z.string().optional(),
});

const CaretakerAttrs = z.object({
    patientName: z.string().optional(),
    hospitalCertNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),
});

// 存檔時 (Create/Update)
export async function updateEmployer(id: string, data: any) {
    let jsonString = null;

    // Remove coreData separation if data is flat, but user example used data.coreData
    // Assuming 'data' contains { coreData: {...}, attributes: {...}, category: string }
    // Or simpler: data has mixed fields. 
    // Let's assume the caller passes { ...coreFields, attributes: {...} }
    // But to match user pattern:

    const { attributes, ...coreData } = data;

    // 根據類別驗證資料
    if (attributes) {
        if (data.category === 'MANUFACTURING' || coreData.category === 'MANUFACTURING') {
            const parsed = FactoryAttrs.parse(attributes); // 驗證失敗會噴錯，保護資料庫
            jsonString = JSON.stringify(parsed);
        } else if (data.category === 'HOME_CARE' || coreData.category === 'HOME_CARE' || data.category === 'CARETAKER') {
            const parsed = CaretakerAttrs.parse(attributes);
            jsonString = JSON.stringify(parsed);
        } else {
            // For other categories, maybe just stringify if exists, or ignore
            jsonString = JSON.stringify(attributes);
        }
    }

    return prisma.employer.update({
        where: { id },
        data: {
            ...coreData,
            industryAttributes: jsonString
        }
    });
}

export const analyzeDataHealth = async (employerId: string) => {
    const employer = await prisma.employer.findUnique({
        where: { id: employerId },
        include: {
            // factoryInfo relation removed
            laborCounts: { orderBy: { year: 'desc', month: 'desc' }, take: 1 }
        }
    });

    if (!employer) throw new Error('Employer not found');

    const missingFields: string[] = [];
    const alertsToCreate: string[] = [];

    // --- 1. Tax ID (Unified Business No) ---
    // Rule: Corporate=8 digits, Individual=1 letter+9 digits
    const taxId = employer.taxId || '';
    if (!taxId) {
        missingFields.push('Missing Tax ID');
        alertsToCreate.push('缺統編：無法進行任何政府申辦');
    } else {
        if (employer.type === 'individual') {
            if (!/^[A-Z][0-9]{9}$/.test(taxId)) {
                missingFields.push('Invalid Tax ID Format (Individual)');
                alertsToCreate.push('統編格式錯誤 (自然人需為身分證字號)');
            }
        } else {
            // Default corporate
            if (!/^\d{8}$/.test(taxId)) {
                missingFields.push('Invalid Tax ID Format (Corporate)');
                alertsToCreate.push('統編格式錯誤 (法人需為 8 碼數字)');
            }
        }
    }

    // --- 2. Responsible Person ID ---
    const repId = employer.responsiblePersonIdNo || '';
    if (!repId || !/^[A-Z][0-9]{9}$/.test(repId)) {
        missingFields.push('Missing/Invalid Responsible Person ID');
        alertsToCreate.push('缺負責人身分證號：無法進行 e 化服務授權與招募許可');
    }

    // --- 3. Labor Insurance No ---
    // Rule: 8 digits + 1 check digit (Total 9 chars usually, or 8+1 format)
    const laborNo = employer.laborInsuranceNo || '';
    if (!laborNo || !/^\d{8,9}$/.test(laborNo.replace(/-/g, ''))) {
        missingFields.push('Missing/Invalid Labor Insurance No');
        alertsToCreate.push('缺勞保證號：無法產出招募許可與加保表');
    }

    // --- 4. Manufacturing Specifics ---
    const isManufacturing = employer.category === 'MANUFACTURING' || employer.industryType?.includes('製造');
    if (isManufacturing) {
        // Parse attributes
        let factoryAttrs: any = {};
        if (employer.industryAttributes) {
            try {
                factoryAttrs = JSON.parse(employer.industryAttributes);
            } catch (e) {
                console.warn('Failed to parse industryAttributes', e);
            }
        }

        // Factory Address
        // Check core address first, then factory attributes
        const hasAddress = employer.address || factoryAttrs.factoryAddress;
        if (!hasAddress) {
            missingFields.push('Missing Factory Address');
            alertsToCreate.push('缺工廠地址：無法產出求才登記、入國通報與生活計畫書');
        }

        // Allocation Rate (3K5)
        const validRates = [0.10, 0.15, 0.20, 0.25, 0.35];
        const rate = Number(employer.allocationRate);
        if (!employer.allocationRate || !validRates.includes(rate)) {
            missingFields.push('Missing/Invalid Allocation Rate');
            alertsToCreate.push('缺核配比率：無法計算 3K5 級可招募名額');
        }
    }

    // --- 5. Compliance Standard ---
    if (!employer.complianceStandard) {
        missingFields.push('Missing Compliance Standard');
        alertsToCreate.push('缺合規標準 (RBA/IWAY)：無法自動判斷零付費規則');
    }

    // --- Alert Management ---
    // 1. Fetch existing DATA_MISSING alerts for this employer
    const existingAlerts = await prisma.incident.findMany({
        where: {
            employerId,
            type: 'DATA_MISSING',
            status: 'open'
        }
    });

    // 2. Identify alerts to create (deduplicate)
    for (const msg of alertsToCreate) {
        const exists = existingAlerts.find(a => a.description === msg);
        if (!exists) {
            await prisma.incident.create({
                data: {
                    employerId,
                    type: 'DATA_MISSING',
                    severityLevel: 'LOW',
                    description: msg,
                    status: 'open',
                    isAutoGenerated: true
                }
            });
        }
    }

    // 3. Identify alerts to resolve (if issue is fixed)
    for (const alert of existingAlerts) {
        if (!alertsToCreate.includes(alert.description)) {
            await prisma.incident.update({
                where: { id: alert.id },
                data: { status: 'resolved' }
            });
        }
    }

    const isReady = missingFields.length === 0;

    return {
        isReady,
        status: isReady ? 'READY_TO_RECRUIT' : 'MISSING_INFO',
        missingFields,
        alerts: alertsToCreate,
        employerName: employer.companyName
    };
};

export const checkRecruitmentReadiness = analyzeDataHealth;
