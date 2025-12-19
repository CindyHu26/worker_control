// Industry Categories (產業別)
export const INDUSTRIES = {
    MANUFACTURING: '製造業',
    CONSTRUCTION: '營造業',
    FISHERY: '漁業',
    HOME_CARE: '家庭看護',
    HOME_HELPER: '家庭幫傭',
    INSTITUTION: '養護機構',
    AGRICULTURE: '農業',
    SLAUGHTER: '屠宰業',
    OUTREACH_AGRICULTURE: '外展農務',
    HOSPITALITY: '餐旅業',
    OTHER: '其他'
} as const;

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

export type IndustryKey = keyof typeof INDUSTRIES;

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

// Industry Code to Category Mapping (for backend compatibility)
export const INDUSTRY_CODE_MAP: Record<string, IndustryKey> = {
    '01': 'MANUFACTURING',
    '02': 'CONSTRUCTION',
    '03': 'FISHERY',
    '04': 'AGRICULTURE',
    '05': 'SLAUGHTER',
    '06': 'HOME_CARE',
    '07': 'HOME_HELPER',
    '08': 'INSTITUTION',
    '09': 'OUTREACH_AGRICULTURE',
    '10': 'HOSPITALITY',
    '99': 'OTHER'
};

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
    return industry === 'MANUFACTURING';
}

export function requiresFactoryInfo(industry: string | null | undefined): boolean {
    return isManufacturingIndustry(industry);
}
