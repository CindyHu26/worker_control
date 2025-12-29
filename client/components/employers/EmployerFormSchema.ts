import * as z from 'zod';
import { isValidGUINumber, isValidNationalID } from '@/utils/validation';

// Validation Schema
export const baseSchema = z.object({
    // Basic
    code: z.string().optional(),
    shortName: z.string().optional(),
    companyName: z.string().min(1, '雇主/公司名稱為必填'),
    companyNameEn: z.string().optional().or(z.literal('')),
    taxId: z.string().optional().or(z.literal('')),
    phoneNumber: z.string().optional().or(z.literal('')),
    mobilePhone: z.string().optional().or(z.literal('')),
    email: z.string().email('Email 格式錯誤').optional().or(z.literal('')),

    // Responsible Person
    responsiblePerson: z.string().optional(),
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    englishName: z.string().optional(),
    birthPlace: z.string().optional(),
    birthPlaceEn: z.string().optional(),
    residenceAddress: z.string().optional(),
    residenceZip: z.string().optional(),
    residenceCityCode: z.string().optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    mobilePhoneIndividual: z.string().optional(), // [Added]
    idIssueDate: z.string().optional(),

    idIssuePlace: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),

    // Addresses & Contact
    address: z.string().optional(),
    addressEn: z.string().optional(),
    invoiceAddress: z.string().optional(),
    taxAddress: z.string().optional(),
    healthBillAddress: z.string().optional(),
    healthBillZip: z.string().optional(),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    category: z.string(),
    categoryType: z.string().optional(), // 'BUSINESS' | 'INDIVIDUAL' | 'INSTITUTION'

    // Factories (Array)
    factories: z.array(z.object({
        id: z.string().optional(),
        name: z.string().min(1, '廠區名稱必填'),
        factoryRegNo: z.string().optional(),
        address: z.string().optional(),
        addressEn: z.string().optional(),
        zipCode: z.string().optional(),
        cityCode: z.string().optional(),
        laborCount: z.string().optional(),
        foreignCount: z.string().optional()
    })).optional(),

    // Manufacturing (CorporateInfo)
    factoryRegistrationNo: z.string().optional(),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    capital: z.string().optional().or(z.literal('')),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(),
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(),
    faxNumber: z.string().optional().or(z.literal('')),

    // Home Care (IndividualInfo specifics)
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Institution
    institutionCode: z.string().optional(),
    bedCount: z.union([z.string(), z.number()]).optional(),

    // Internal Management
    referrer: z.string().optional(),
    agencyId: z.string().optional(),
    terminateDate: z.string().optional(),

    remarks: z.string().optional(),

    // Labor Count
    avgDomesticWorkers: z.string().optional(),

    // Legacy / Industry Attributes
    industryAttributes: z.object({
        applicationType: z.string().optional(),
        isForeigner: z.string().optional(),
        businessRegistrationNo: z.string().optional(),
        licenseExpiryDate: z.string().optional(),
        managementSource: z.string().optional(),
        developmentDate: z.string().optional(),
        domesticAgency: z.string().optional(),
        adminStaff: z.string().optional(),
        salesAgent: z.string().optional(),
        customerService: z.string().optional(),
        professionalStaff: z.string().optional(),
        accountant: z.string().optional(),
        specialInstructions: z.string().optional(),
        timingReference: z.string().optional(),
        legacyRef95: z.string().optional(),
        legacyRef96: z.string().optional(),
        // [New] Agriculture Specifics
        qualificationLetter: z.string().optional(), // 農業部核發之資格認定函 (Individual/Farmer)
        outreachApproval: z.string().optional(),    // 外展計畫核定函 (Outreach)
    }).optional(),
});

export const employerSchema = baseSchema.superRefine((data, ctx) => {
    // Determine type: Use hidden field categoryType or infer from known codes if fallback needed
    const isIndividual = data.categoryType === 'INDIVIDUAL';
    const isBusiness = data.categoryType === 'BUSINESS' || data.categoryType === 'INSTITUTION' || !data.categoryType; // Default to business if unknown

    if (isIndividual) {
        // Household: Must have ID No, Must NOT have Tax ID
        if (data.taxId && data.taxId.trim() !== '') {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "家庭類雇主不需要統編 (請留空)",
                path: ["taxId"]
            });
        }
        if (!data.responsiblePersonIdNo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "家庭類雇主必須填寫負責人身分證字號",
                path: ["responsiblePersonIdNo"]
            });
        } else if (!isValidNationalID(data.responsiblePersonIdNo)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "負責人身分證字號格式錯誤",
                path: ["responsiblePersonIdNo"]
            });
        }
    } else {
        // Business: Must have Tax ID
        if (!data.taxId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "事業類雇主必須填寫統一編號",
                path: ["taxId"]
            });
        } else if (!isValidGUINumber(data.taxId)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "統一編號格式錯誤 (需為8碼數字，並符合邏輯運算)",
                path: ["taxId"]
            });
        }

        if (!data.responsiblePerson) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "事業類雇主必須填寫負責人姓名",
                path: ["responsiblePerson"]
            });
        }
    }

    // [New] Agriculture Validation
    if (data.category === 'AGRICULTURE_FARMING' && isIndividual) {
        if (!data.industryAttributes?.qualificationLetter) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "個人農民申請必須填寫「農業部資格認定函文號」",
                path: ["industryAttributes", "qualificationLetter"]
            });
        }
    }
    if (data.category === 'AGRICULTURE_OUTREACH') {
        if (!data.industryAttributes?.outreachApproval) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "外展農務工作必須填寫「外展計畫核定函文號」",
                path: ["industryAttributes", "outreachApproval"]
            });
        }
    }
});

export type EmployerFormData = z.infer<typeof baseSchema>;
