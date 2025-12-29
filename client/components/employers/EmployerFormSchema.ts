import * as z from 'zod';
import { isValidGUINumber, isValidNationalID } from '@/utils/validation';

// ==========================================
// 雇主表單驗證 Schema
// 根據參考 HTML (雇主基本資料檔.html) 重新設計
// ==========================================

// 工廠資訊 Schema
const factorySchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(), // 廠名
    factoryRegNo: z.string().optional(), // 工廠登記證號

    // 地址部分
    zipCode: z.string().optional(), // 郵遞區號
    city: z.string().optional(), // 縣市
    district: z.string().optional(), // 鄉鎮市區
    cityCode: z.string().optional(), // 縣市代碼
    address: z.string().optional(), // 地址-中文 (完整)
    detailAddress: z.string().optional(), // 地址-路段 (UI用)
    addressEn: z.string().optional(), // 地址-英文

    laborCount: z.string().optional(), // 員工人數
    foreignCount: z.string().optional() // 外勞人數
});

// 主 Schema
export const baseSchema = z.object({
    // ==========================================
    // 區塊一：雇主識別
    // ==========================================
    code: z.string().optional(), // 雇主編號
    taxId: z.string().optional().or(z.literal('')), // 統一編號 (8碼) 或 身分證字號 (10碼)
    shortName: z.string().optional(), // 雇主簡稱

    // ==========================================
    // 區塊二：公司/雇主資訊
    // ==========================================
    companyName: z.string().min(1, '雇主/公司名稱為必填'), // 公司名稱-中文
    companyNameEn: z.string().optional().or(z.literal('')), // 公司名稱-英文
    isForeignOwner: z.boolean().optional(), // 外國人雇主

    // ==========================================
    // 區塊三：負責人資訊
    // ==========================================
    responsiblePerson: z.string().optional(), // 負責人姓名-中文
    englishName: z.string().optional(), // 負責人姓名-英文
    responsiblePersonIdNo: z.string().optional(), // 負責人身分證字號
    responsiblePersonDob: z.string().optional(), // 負責人出生日期

    // 負責人地址
    residenceZip: z.string().optional(), // 負責人郵遞區號
    residenceCity: z.string().optional(), // 縣市
    residenceDistrict: z.string().optional(), // 鄉鎮市區
    residenceCityCode: z.string().optional(), // 負責人縣市代碼 (保留)
    residenceAddress: z.string().optional(), // 負責人地址-中文 (街道或完整)
    residenceDetailAddress: z.string().optional(), // 負責人地址-路段 (UI用)
    residenceAddressEn: z.string().optional(), // 負責人地址-英文

    // 負責人家庭資訊 (身份證用)
    birthPlace: z.string().optional(), // 出生地
    birthPlaceEn: z.string().optional(), // 出生地-英文
    responsiblePersonFather: z.string().optional(), // 父
    responsiblePersonMother: z.string().optional(), // 母
    responsiblePersonSpouse: z.string().optional(), // 配偶
    idIssueDate: z.string().optional(), // 發證日期
    idIssuePlace: z.string().optional(), // 發證地點
    militaryStatus: z.string().optional(), // 役別
    militaryStatusEn: z.string().optional(), // 役別-英文

    // ==========================================
    // 區塊四：公司地址
    // ==========================================
    companyZip: z.string().optional(), // 公司郵遞區號
    companyCity: z.string().optional(), // 縣市
    companyDistrict: z.string().optional(), // 鄉鎮市區
    companyCityCode: z.string().optional(), // 公司縣市代碼
    address: z.string().optional(), // 公司地址-中文
    companyDetailAddress: z.string().optional(), // 公司地址-路段 (UI用)
    addressEn: z.string().optional(), // 公司地址-英文

    // ==========================================
    // 區塊五：聯絡資訊
    // ==========================================
    contactPerson: z.string().optional(), // 單位承辦人
    phoneNumber: z.string().optional().or(z.literal('')), // 電話 TEL
    faxNumber: z.string().optional().or(z.literal('')), // 傳真 FAX
    mobilePhone: z.string().optional().or(z.literal('')), // 行動電話
    email: z.string().email('Email 格式錯誤').optional().or(z.literal('')), // E-mail

    // 聯絡人 (另一位)
    contactPerson2: z.string().optional(), // 聯絡人
    contactPhone2: z.string().optional(), // 聯絡人電話
    contactFax2: z.string().optional(), // 聯絡人傳真
    contactMobile2: z.string().optional(), // 聯絡人行動電話
    contactEmail2: z.string().optional(), // 聯絡人 Email
    contactBirthday: z.string().optional(), // 聯絡人生日

    // ==========================================
    // 區塊六：保險/證照資訊
    // ==========================================
    laborInsuranceNo: z.string().optional(), // 公司勞保證號
    healthInsuranceUnitNo: z.string().optional(), // 健保單位代號
    businessRegistrationNo: z.string().optional(), // 營利事業證號
    factoryRegistrationNo: z.string().optional(), // 工廠登記證號
    licenseExpiryDate: z.string().optional(), // 執照效期

    // ==========================================
    // 區塊七：內部管理
    // ==========================================
    salesAgentId: z.string().optional(), // 移工業務員
    professionalStaffId: z.string().optional(), // 移工專業人員
    customerServiceId: z.string().optional(), // 客服員
    adminStaffId: z.string().optional(), // 行政人員
    accountantId: z.string().optional(), // 會計人員
    remarks: z.string().optional(), // 附註
    referrer: z.string().optional(), // 介紹人
    managementSource: z.string().optional(), // 來源別 (業務開發/電訪件/公關件/公司件)
    developmentDate: z.string().optional(), // 開發日期
    agencyId: z.string().optional(), // 國內仲介公司
    terminateDate: z.string().optional(), // 終止委任日期

    // ==========================================
    // 區塊八：工廠資訊 (1:N)
    // ==========================================
    factories: z.array(factorySchema).optional(),

    // ==========================================
    // 其他地址 (帳務用)
    // ==========================================
    invoiceAddress: z.string().optional(), // 發票地址
    taxAddress: z.string().optional(), // 稅單地址
    healthBillAddress: z.string().optional(), // 健保帳單地址
    healthBillZip: z.string().optional(), // 健保帳單郵遞區號
});

// 驗證邏輯
export const employerSchema = baseSchema.superRefine((data, ctx) => {
    // 判斷是個人還是事業：根據統編/身分證字號格式自動判斷
    const taxIdValue = data.taxId?.trim() || '';
    const isIndividual = taxIdValue.length === 10 && /^[A-Z][12]\d{8}$/i.test(taxIdValue);
    const isBusiness = taxIdValue.length === 8 && /^\d{8}$/.test(taxIdValue);

    if (taxIdValue && !isIndividual && !isBusiness) {
        // 有填寫但格式不對
        if (taxIdValue.length === 8) {
            if (!isValidGUINumber(taxIdValue)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "統一編號格式錯誤 (需為8碼數字，並符合邏輯運算)",
                    path: ["taxId"]
                });
            }
        } else if (taxIdValue.length === 10) {
            if (!isValidNationalID(taxIdValue)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "身分證字號格式錯誤",
                    path: ["taxId"]
                });
            }
        } else {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "請輸入8碼統一編號或10碼身分證字號",
                path: ["taxId"]
            });
        }
    }

    // 事業類檢查
    if (isBusiness) {
        if (!isValidGUINumber(taxIdValue)) {
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

    // 個人類檢查
    if (isIndividual) {
        if (!isValidNationalID(taxIdValue)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "身分證字號格式錯誤",
                path: ["taxId"]
            });
        }
    }
});

export type EmployerFormData = z.infer<typeof baseSchema>;
