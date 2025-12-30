/**
 * 申請項目與工種常數定義
 * Application Categories & Work Titles Constants
 * 
 * 這些常數用於前端 UI 的顯示與預設值邏輯。
 * 實際資料仍以後端 API 為主，這裡只提供預設顯示用途。
 * 
 * ⚠️ 注意：工種清單可能會因勞動部公告而變動，
 *         建議定期與後端 /api/work-titles 同步。
 */

// ===========================================
// 申請項目 (Application Categories)
// ===========================================

export type EmployerType = 'BUSINESS' | 'INDIVIDUAL' | 'INSTITUTION';

export interface ApplicationCategoryDef {
    code: string;
    nameZh: string;
    nameEn: string;
    type: EmployerType;
    isIntermediate?: boolean; // 是否為中階技術人力類別
    quotaBaseRate?: number;   // 基礎核配率 (e.g., 0.20 = 20%)
}

/**
 * 標準申請項目定義
 * 這些對應勞動部核發的「招募許可函」類別
 */
export const APPLICATION_CATEGORIES: Record<string, ApplicationCategoryDef> = {
    // ========== 家庭類 (個人雇主) ==========
    HOME_CARE: {
        code: 'HOME_CARE',
        nameZh: '家庭看護工作',
        nameEn: 'Home Caregiver',
        type: 'INDIVIDUAL',
    },
    HOME_HELPER: {
        code: 'HOME_HELPER',
        nameZh: '家庭幫傭工作',
        nameEn: 'Home Helper',
        type: 'INDIVIDUAL',
    },

    // ========== 機構類 ==========
    INSTITUTION: {
        code: 'INSTITUTION',
        nameZh: '機構看護工作',
        nameEn: 'Institutional Caregiver',
        type: 'INSTITUTION',
    },

    // ========== 產業類 (企業雇主) ==========
    MANUFACTURING: {
        code: 'MANUFACTURING',
        nameZh: '製造工作',
        nameEn: 'Manufacturing Work',
        type: 'BUSINESS',
        quotaBaseRate: 0.20,
    },
    CONSTRUCTION: {
        code: 'CONSTRUCTION',
        nameZh: '營造工作',
        nameEn: 'Construction Work',
        type: 'BUSINESS',
        quotaBaseRate: 0.40,
    },
    FISHERY: {
        code: 'FISHERY',
        nameZh: '海洋漁撈工作',
        nameEn: 'Fishing Work',
        type: 'BUSINESS',
    },
    AGRICULTURE_FARMING: {
        code: 'AGRICULTURE_FARMING',
        nameZh: '農業工作 (農糧/畜牧/養殖)',
        nameEn: 'Agriculture Farming',
        type: 'BUSINESS', // Can be toggled to INDIVIDUAL in UI
    },
    AGRICULTURE_OUTREACH: {
        code: 'AGRICULTURE_OUTREACH',
        nameZh: '外展農務工作',
        nameEn: 'Outreach Agriculture',
        type: 'BUSINESS', // Must be BUSINESS
    },

    // ========== 中階技術人力 (Intermediate Skilled Workers) ==========
    MID_MANUFACTURING: {
        code: 'MID_MANUFACTURING',
        nameZh: '中階技術製造工作',
        nameEn: 'Intermediate Skilled Manufacturing',
        type: 'BUSINESS',
        isIntermediate: true,
    },
    MID_CONSTRUCTION: {
        code: 'MID_CONSTRUCTION',
        nameZh: '中階技術營造工作',
        nameEn: 'Intermediate Skilled Construction',
        type: 'BUSINESS',
        isIntermediate: true,
    },
    MID_AGRICULTURE: {
        code: 'MID_AGRICULTURE',
        nameZh: '中階技術農業工作',
        nameEn: 'Intermediate Skilled Agriculture',
        type: 'BUSINESS',
        isIntermediate: true,
    },
    MID_AGRICULTURE_OUTREACH: {
        code: 'MID_AGRICULTURE_OUTREACH',
        nameZh: '中階技術外展農務工作',
        nameEn: 'Intermediate Skilled Outreach Agriculture',
        type: 'BUSINESS',
        isIntermediate: true,
    },
    MID_INSTITUTION: {
        code: 'MID_INSTITUTION',
        nameZh: '中階技術機構看護',
        nameEn: 'Intermediate Skilled Institutional Care',
        type: 'INSTITUTION',
        isIntermediate: true,
    },
};

// 定義哪些類別允許 "個人(自然人)" 申請
export const INDIVIDUAL_ELIGIBLE_CATEGORIES = [
    'HOME_CARE',
    'HOME_HELPER',
    'AGRICULTURE_FARMING', // [Modified] 農業工作加入個人許可清單
    'MID_HOME_CARE' // Example if exists
];

// ===========================================
// 工種預設對照表 (Work Title Mapping)
// ===========================================

export interface WorkTitleMapping {
    /** 預設工種名稱 (null 表示必須選擇) */
    defaultTitle: string | null;
    /** 常見工種選項 (僅供 UI 參考，實際以 API 為準) */
    commonOptions: string[];
    /** 是否必須選擇工種 (中階類別通常為 true) */
    requiresSelection: boolean;
}

/**
 * 申請項目 → 工種對照表
 * 用於自動帶入預設值或強制選擇
 */
export const WORK_TITLE_MAPPING: Record<string, WorkTitleMapping> = {
    // ========== 1對1 類別 (自動帶入) ==========
    HOME_CARE: {
        defaultTitle: '家庭看護工',
        commonOptions: ['家庭看護工'],
        requiresSelection: false,
    },
    HOME_HELPER: {
        defaultTitle: '家庭幫傭',
        commonOptions: ['家庭幫傭'],
        requiresSelection: false,
    },
    INSTITUTION: {
        defaultTitle: '機構看護工',
        commonOptions: ['機構看護工'],
        requiresSelection: false,
    },

    // ========== 1對少數 類別 (有預設值，可修改) ==========
    MANUFACTURING: {
        defaultTitle: '製造工',
        commonOptions: ['製造工', '操作工', '體力工', '生產線作業員'],
        requiresSelection: false,
    },
    CONSTRUCTION: {
        defaultTitle: '營造工',
        commonOptions: ['營造工', '模板工', '鋼筋工', '泥作工'],
        requiresSelection: false,
    },
    FISHERY: {
        defaultTitle: '漁撈工',
        commonOptions: ['漁撈工'],
        requiresSelection: false,
    },
    AGRICULTURE_FARMING: {
        defaultTitle: '農務工',
        commonOptions: ['農務工', '畜牧工', '養殖工'],
        requiresSelection: false,
    },
    AGRICULTURE_OUTREACH: {
        defaultTitle: '外展農務工',
        commonOptions: ['外展農務工'],
        requiresSelection: false,
    },

    // ========== 中階技術類別 (必須選擇具體職稱) ==========
    MID_MANUFACTURING: {
        defaultTitle: null, // 不給預設，強迫選擇
        commonOptions: [
            '金屬成型技術員',
            '表面處理技術員',
            '機械加工技術員',
            '工業電子技術員',
            '食品製造技術員',
            '塑膠射出技術員',
            'CNC操作技術員',
            '品保檢驗技術員',
            '工業配管技術員',
            '電焊技術員',
        ],
        requiresSelection: true,
    },
    MID_CONSTRUCTION: {
        defaultTitle: null,
        commonOptions: [
            '模板技術員',
            '鋼筋技術員',
            '混凝土技術員',
            '水電技術員',
            '測量技術員',
        ],
        requiresSelection: true,
    },
    MID_AGRICULTURE: {
        defaultTitle: null,
        commonOptions: [
            '農業技術員',
            '畜牧技術員',
            '水產養殖技術員',
        ],
        requiresSelection: true,
    },
    MID_INSTITUTION: {
        defaultTitle: null,
        commonOptions: [
            '照顧服務技術員',
        ],
        requiresSelection: true,
    },
};

// ===========================================
// Helper Functions
// ===========================================

/**
 * 根據申請項目代碼取得預設工種
 */
export function getDefaultWorkTitle(categoryCode: string): string | null {
    return WORK_TITLE_MAPPING[categoryCode]?.defaultTitle ?? null;
}

/**
 * 判斷該申請項目是否需要強制選擇工種
 */
export function requiresWorkTitleSelection(categoryCode: string): boolean {
    return WORK_TITLE_MAPPING[categoryCode]?.requiresSelection ?? false;
}

/**
 * 判斷該申請項目是否為中階技術人力
 */
export function isIntermediateCategory(categoryCode: string): boolean {
    return APPLICATION_CATEGORIES[categoryCode]?.isIntermediate ?? false;
}

/**
 * 取得該申請項目的常見工種選項 (供 UI 下拉選單參考)
 */
export function getCommonWorkTitles(categoryCode: string): string[] {
    return WORK_TITLE_MAPPING[categoryCode]?.commonOptions ?? [];
}

/**
 * 取得申請項目列表 (供下拉選單使用)
 */
export function getApplicationCategoryOptions() {
    return Object.values(APPLICATION_CATEGORIES).map(cat => ({
        value: cat.code,
        label: cat.nameZh,
        type: cat.type,
        isIntermediate: cat.isIntermediate ?? false,
    }));
}

// ===========================================
// 工廠五級制 (Employment Stability Fee Ranking)
// ===========================================
export const FACTORY_RANKING_OPTIONS = [
    { value: "10", label: "D級行業: 10%" },
    { value: "15", label: "C級行業: 15%" },
    { value: "20", label: "B級行業: 20%" },
    { value: "25", label: "A級行業: 25%" },
    { value: "30", label: "營造業: 30%" },
    { value: "35", label: "A+級行業: 35%" },
    { value: "40", label: "自由貿易港區: 40%" },
];
