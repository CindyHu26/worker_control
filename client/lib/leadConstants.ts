// 1. 第一層：申請類別 (Program Type)
export const PROGRAM_TYPES = {
    GENERAL: '申請移工 (一般外國人)',
    MID_LEVEL: '申請中階技術人員 (留才久用方案)',
    DIRECT_HIRE: '直接聘僱 (直聘中心代辦/諮詢)'
} as const;

export type ProgramTypeKey = keyof typeof PROGRAM_TYPES;

// 2. 第二層：詳細職務項目 (Job Categories)
export const JOB_CATEGORIES = {
    // === 一般移工清單 ===
    GENERAL: {
        HOME_CARE: '家庭看護工作',
        HOME_HELPER: '家庭幫傭工作',
        INSTITUTION: '機構看護工',
        MANUFACTURING: '製造工作',
        MANUFACTURING_OUTREACH: '外展製造工作',
        CONSTRUCTION: '營造工作',
        SLAUGHTER: '屠宰工作',
        FISHERY: '海洋漁撈工作',
        AGRICULTURE_FARMING: '農業工作 (農糧/畜牧/養殖)',
        AGRICULTURE_OUTREACH: '外展農務工作',
        DIVERSIFIED_CARE: '多元陪伴照顧服務工作',
        WASTE_RECYCLING: '廢棄物及資源物回收處理工作',
    },

    // === 中階技術人員清單 ===
    MID_LEVEL: {
        MID_HOME_CARE: '中階技術家庭看護工作',
        MID_INSTITUTION: '中階技術機構看護工作',
        MID_MANUFACTURING: '中階技術製造工作',
        MID_CONSTRUCTION: '中階技術營造工作',
        MID_FISHERY: '中階技術海洋漁撈工作',
        MID_AGRICULTURE: '中階技術農業工作',
        MID_AGRICULTURE_OUTREACH: '中階技術外展農務工作',
        MID_SLAUGHTER: '中階技術屠宰工作',
    },

    // === 直接聘僱 ===
    DIRECT_HIRE: {
        DH_SERVICE: '直接聘僱服務',
    }
} as const;

export type JobCategoryKey = keyof typeof JOB_CATEGORIES.GENERAL | keyof typeof JOB_CATEGORIES.MID_LEVEL | keyof typeof JOB_CATEGORIES.DIRECT_HIRE;

// 3. 系統輔助邏輯：定義哪些需要統編(法人)，哪些需要身分證(自然人)
export const ENTITY_TYPES = {
    BUSINESS_REQUIRED: [
        'MANUFACTURING', 'MANUFACTURING_OUTREACH', 'CONSTRUCTION', 'WASTE_RECYCLING',
        'INSTITUTION', 'SLAUGHTER', 'FISHERY', 'AGRICULTURE_OUTREACH', 'DIVERSIFIED_CARE',
        'MID_MANUFACTURING', 'MID_CONSTRUCTION', 'MID_INSTITUTION', 'MID_SLAUGHTER',
        'MID_FISHERY', 'MID_AGRICULTURE_OUTREACH'
    ],
    INDIVIDUAL_REQUIRED: [
        'HOME_CARE', 'HOME_HELPER', 'MID_HOME_CARE'
    ],
    HYBRID: [
        'AGRICULTURE_FARMING', 'MID_AGRICULTURE' // 農業與中階農業較特殊，可能為農場(法人)或農民(個人)
    ]
} as const;

// Legacy support for existing code that uses INDUSTRIES
// We flatten all job categories into a single object
export const INDUSTRIES = {
    ...JOB_CATEGORIES.GENERAL,
    ...JOB_CATEGORIES.MID_LEVEL,
    ...JOB_CATEGORIES.DIRECT_HIRE
} as const;

export type IndustryKey = keyof typeof INDUSTRIES;

export const BASE_RATES = [
    { label: '10% (級別 D)', value: '0.10' },
    { label: '15% (級別 C)', value: '0.15' },
    { label: '20% (級別 B)', value: '0.20' },
    { label: '25% (級別 A)', value: '0.25' },
    { label: '35% (級別 A+)', value: '0.35' }
] as const;

export const EXTRA_RATES = [
    { label: '無 (None)', value: '0.00' },
    { label: '+5% (Extra)', value: '0.05' },
    { label: '+10% (Extra)', value: '0.10' },
    { label: '+15% (Extra)', value: '0.15' }
] as const;

export const ALLOCATION_RATES = [
    { label: '10% (級別 D)', value: '0.10' },
    { label: '15% (級別 C)', value: '0.15' },
    { label: '20% (級別 B)', value: '0.20' },
    { label: '25% (級別 A)', value: '0.25' },
    { label: '30% (含 Extra)', value: '0.30' },
    { label: '35% (級別 A+)', value: '0.35' },
    { label: '40% (最高上限)', value: '0.40' }
] as const;

// export type IndustryKey = keyof typeof INDUSTRIES; // Removed duplicate

// Lead Status (潛在客戶狀態)
export const LEAD_STATUSES = {
    NEW: '新建立',
    CONTACTED: '已聯繫',
    MEETING: '會議中',
    NEGOTIATING: '洽談中',
    WON: '已轉正',
    LOST: '已流失'
} as const;

export type LeadStatusKey = keyof typeof LEAD_STATUSES;

// Status Badge Colors
export const STATUS_COLORS: Record<LeadStatusKey, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-purple-100 text-purple-800',
    MEETING: 'bg-yellow-100 text-yellow-800',
    NEGOTIATING: 'bg-orange-100 text-orange-800',
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-gray-100 text-gray-800'
};

// Interaction Types (互動類型)
export const INTERACTION_TYPES = {
    CALL: '電話聯繫',
    VISIT: '實地拜訪',
    EMAIL: '電子郵件',
    LINE: 'LINE訊息',
    MEETING: '會議'
} as const;

export type InteractionTypeKey = keyof typeof INTERACTION_TYPES;

// Interaction Outcomes (互動結果)
export const INTERACTION_OUTCOMES = {
    SUCCESSFUL: '成功',
    FOLLOW_UP: '需追蹤',
    NO_RESPONSE: '未回應',
    DECLINED: '婉拒',
    INTERESTED: '有興趣'
} as const;

// Helper function to get Chinese label
export function getIndustryLabel(key: string | null | undefined): string {
    if (!key) return '未指定';
    return INDUSTRIES[key as IndustryKey] || key;
}

export function getStatusLabel(key: string | null | undefined): string {
    if (!key) return '未知';
    return LEAD_STATUSES[key as LeadStatusKey] || key;
}

export function getInteractionTypeLabel(key: string | null | undefined): string {
    if (!key) return '其他';
    return INTERACTION_TYPES[key as InteractionTypeKey] || key;
}

// Validation helpers
export function isManufacturingIndustry(industry: string | null | undefined): boolean {
    return industry === 'MANUFACTURING' || industry === 'MID_MANUFACTURING';
}

export function requiresFactoryInfo(industry: string | null | undefined): boolean {
    // 一般製造業與中階製造業需工廠登記，外展製造業可能不需要(是機構)
    return isManufacturingIndustry(industry);
}

// Industry Code to Category Mapping (Updated for new keys)
export const INDUSTRY_CODE_MAP: Record<string, IndustryKey> = {
    '01': 'MANUFACTURING',
    '02': 'CONSTRUCTION',
    '03': 'FISHERY',
    '04': 'AGRICULTURE_FARMING',
    '05': 'SLAUGHTER',
    '06': 'HOME_CARE',
    '07': 'HOME_HELPER',
    '08': 'INSTITUTION',
    '09': 'AGRICULTURE_OUTREACH', // Updated from OUTREACH_AGRICULTURE
    // '10': 'HOSPITALITY', // Removed as not in new list
    // '99': 'OTHER' // Removed as not in new list
};
// Helper function to resolve program type from job category key
export function getProgramTypeFromCategory(category: string | null | undefined): ProgramTypeKey | undefined {
    if (!category) return undefined;
    if (category in JOB_CATEGORIES.GENERAL) return 'GENERAL';
    if (category in JOB_CATEGORIES.MID_LEVEL) return 'MID_LEVEL';
    if (category in JOB_CATEGORIES.DIRECT_HIRE) return 'DIRECT_HIRE';
    return undefined;
}
