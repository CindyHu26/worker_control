// Recruitment Letter Types
export const RecruitmentTypeMap: Record<string, string> = {
    '初招': '初次招募 (Initial)',
    '重招': '重招 (Re-recruit)',
    '遞補': '遞補 (Replacement)',
    '接續聘僱': '接續聘僱 (Transfer)',
    '一般': '一般 (General)'
};

// Deployment/Service Status with UI Colors
export const StatusMap: Record<string, { label: string; color: string }> = {
    active: {
        label: '履約中 (Active)',
        color: 'bg-green-100 text-green-800 border-green-200'
    },
    ended: {
        label: '已結束 (Ended)',
        color: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    pending: {
        label: '申辦中 (Processing)',
        color: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    terminated: {
        label: '中途解約 (Terminated)',
        color: 'bg-red-100 text-red-800 border-red-200'
    },
    // Service Status
    active_service: { label: '服務中', color: 'text-green-600' },
    contract_terminated: { label: '解約', color: 'text-red-600' },
    runaway: { label: '逃逸', color: 'text-red-700 font-bold' },
    transferred_out: { label: '轉出', color: 'text-orange-600' },
    commission_ended: { label: '期滿', color: 'text-gray-600' }
};

export const CountryMap: Record<string, string> = {
    'ID': '印尼 (Indonesia)',
    'VN': '越南 (Vietnam)',
    'PH': '菲律賓 (Philippines)',
    'TH': '泰國 (Thailand)'
};
