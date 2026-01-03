export interface PlaceholderDefinition {
    key: string;
    label: string;
    category: string;
    example: string;
    description?: string;
}

export const PLACEHOLDERS: PlaceholderDefinition[] = [
    // --- 移工資料 (Worker) ---
    { key: 'worker_name_en', label: '移工英文姓名', category: '移工資料 (Worker)', example: 'NGUYEN VAN A' },
    { key: 'worker_name_cn', label: '移工中文姓名', category: '移工資料 (Worker)', example: '阮文安' },
    { key: 'worker_nationality', label: '移工國籍', category: '移工資料 (Worker)', example: 'VN' },
    { key: 'worker_gender', label: '移工性別', category: '移工資料 (Worker)', example: '男' },
    { key: 'worker_dob', label: '移工出生日期', category: '移工資料 (Worker)', example: '1990/01/15' },
    { key: 'worker_mobile', label: '移工手機號碼', category: '移工資料 (Worker)', example: '0912345678' },
    { key: 'worker_line_id', label: 'LINE ID', category: '移工資料 (Worker)', example: 'worker123' },
    { key: 'worker_email', label: '電子郵件', category: '移工資料 (Worker)', example: 'worker@example.com' },
    { key: 'worker_address_foreign', label: '國外地址', category: '移工資料 (Worker)', example: '123 Street, City, Country' },
    { key: 'worker_education', label: '教育程度', category: '移工資料 (Worker)', example: '高中' },
    { key: 'worker_religion', label: '宗教信仰', category: '移工資料 (Worker)', example: '佛教' },
    { key: 'worker_marital_status', label: '婚姻狀況', category: '移工資料 (Worker)', example: '未婚' },
    { key: 'worker_height', label: '身高', category: '移工資料 (Worker)', example: '170' },
    { key: 'worker_weight', label: '體重', category: '移工資料 (Worker)', example: '65' },

    // --- 證件資料 (Documents) ---
    { key: 'worker_passport_no', label: '護照號碼', category: '證件資料 (Documents)', example: 'E12345678' },
    { key: 'worker_passport_issue_date', label: '護照核發日', category: '證件資料 (Documents)', example: '2023/01/15' },
    { key: 'worker_passport_expiry_date', label: '護照效期', category: '證件資料 (Documents)', example: '2033/01/14' },
    { key: 'worker_passport_issue_place', label: '護照核發地', category: '證件資料 (Documents)', example: 'HANOI' },
    { key: 'worker_arc_no', label: '居留證號碼', category: '證件資料 (Documents)', example: 'AA01234567' },
    { key: 'worker_arc_issue_date', label: '居留證核發日', category: '證件資料 (Documents)', example: '2024/06/01' },
    { key: 'worker_arc_expiry_date', label: '居留證效期', category: '證件資料 (Documents)', example: '2027/05/31' },
    { key: 'worker_visa_no', label: '簽證號碼', category: '證件資料 (Documents)', example: 'V987654321' },
    { key: 'worker_flight_no', label: '入境班機', category: '證件資料 (Documents)', example: 'CI789' },
    { key: 'worker_entry_date', label: '入境日期', category: '證件資料 (Documents)', example: '2023/12/15' },

    // --- 雇主資料 (Employer) ---
    { key: 'employer_name', label: '雇主名稱', category: '雇主資料 (Employer)', example: '台積電股份有限公司' },
    { key: 'employer_tax_id', label: '雇主統一編號', category: '雇主資料 (Employer)', example: '12345678' },
    { key: 'employer_phone', label: '雇主電話', category: '雇主資料 (Employer)', example: '02-12345678' },
    { key: 'employer_address', label: '雇主地址', category: '雇主資料 (Employer)', example: '台北市信義區信義路五段7號' },
    { key: 'employer_rep', label: '雇主負責人', category: '雇主資料 (Employer)', example: '張三' },
    { key: 'employer_factory_address', label: '工廠地址', category: '雇主資料 (Employer)', example: '新竹科學園區' },
    { key: 'avg_labor_count', label: '平均勞工人數', category: '雇主資料 (Employer)', example: '150' },
    { key: 'allocation_rate', label: '核配比率', category: '雇主資料 (Employer)', example: '35%' },

    // --- 仲介資料 (Agency) ---
    { key: 'agency_name', label: '仲介公司名稱', category: '仲介資料 (Agency)', example: '永豐人力仲介有限公司' },
    { key: 'agency_license_no', label: '仲介許可證號', category: '仲介資料 (Agency)', example: 'L001234' },
    { key: 'agency_tax_id', label: '仲介統一編號', category: '仲介資料 (Agency)', example: '87654321' },
    { key: 'agency_address', label: '仲介地址', category: '仲介資料 (Agency)', example: '台北市中山區南京東路三段219號' },
    { key: 'agency_phone', label: '仲介電話', category: '仲介資料 (Agency)', example: '02-87654321' },
    { key: 'agency_fax', label: '仲介傳真', category: '仲介資料 (Agency)', example: '02-87654322' },
    { key: 'agency_email', label: '仲介Email', category: '仲介資料 (Agency)', example: 'agency@example.com' },
    { key: 'agency_rep', label: '仲介負責人', category: '仲介資料 (Agency)', example: '李四' },

    // --- 國外仲介 (Foreign Agency) ---
    { key: 'foreign_agency_name', label: '國外仲介名稱', category: '仲介資料 (Agency)', example: 'VN Manpower Co.' },
    { key: 'foreign_agency_code', label: '國外仲介代碼', category: '仲介資料 (Agency)', example: 'VN001' },
    { key: 'foreign_agency_address', label: '國外仲介地址', category: '仲介資料 (Agency)', example: 'Hanoi, Vietnam' },
    { key: 'foreign_agency_country', label: '國外仲介國別', category: '仲介資料 (Agency)', example: 'VN' },

    // --- 聘僱資料 (Employment) ---
    { key: 'worker_contract_start_date', label: '合約起始日', category: '聘僱資料 (Employment)', example: '2024/01/01' },
    { key: 'worker_contract_end_date', label: '合約到期日', category: '聘僱資料 (Employment)', example: '2027/12/31' },
    { key: 'worker_job_description', label: '工作內容描述', category: '聘僱資料 (Employment)', example: '操作機台' },
    { key: 'worker_basic_salary', label: '基本薪資', category: '聘僱資料 (Employment)', example: '27,470' },
    { key: 'worker_job_type', label: '職稱/工作類型', category: '聘僱資料 (Employment)', example: '製造業作業員' },
    { key: 'worker_job_type', label: '職稱/工作類型', category: '聘僱資料 (Employment)', example: '製造業作業員' },
    { key: 'contract_food_provider', label: '伙食提供狀況', category: '聘僱資料 (Employment)', example: '免費提供' },
    { key: 'contract_food_cost', label: '伙食費扣款', category: '聘僱資料 (Employment)', example: '2500' },

    // --- 招募函/許可 (Application Info) ---
    { key: 'app_is_recruit_permit', label: '是否為招募函階段', category: '申辦文件 (Application)', example: 'true/false' },
    { key: 'app_receipt_no', label: '收據號碼/文號', category: '申辦文件 (Application)', example: '112000123' },
    { key: 'app_pay_date', label: '繳費/發文日期', category: '申辦文件 (Application)', example: '2024/01/01' },
    { key: 'app_fee_amount', label: '審查規費金額', category: '申辦文件 (Application)', example: '200' },

    // --- 宿舍資料 (Dormitory) ---
    { key: 'dorm_name', label: '宿舍名稱', category: '宿舍資料 (Dormitory)', example: '員工宿舍A棟' },
    { key: 'dorm_address', label: '宿舍地址', category: '宿舍資料 (Dormitory)', example: '新竹市東區光復路二段101號' },
    { key: 'dorm_landlord', label: '房東', category: '宿舍資料 (Dormitory)', example: '王房東' },
    { key: 'dorm_room_no', label: '房號', category: '宿舍資料 (Dormitory)', example: '3F-A05' },
    { key: 'dorm_bed_code', label: '床位號碼', category: '宿舍資料 (Dormitory)', example: '2' },
    { key: 'dorm_type', label: '住宿類型', category: '宿舍資料 (Dormitory)', example: '雅房' },
    { key: 'dorm_type', label: '住宿類型', category: '宿舍資料 (Dormitory)', example: '雅房' },
    { key: 'dorm_total_area', label: '總面積(平方公尺)', category: '宿舍資料 (Dormitory)', example: '120.5' },
    { key: 'dorm_avg_area_per_person', label: '人均面積', category: '宿舍資料 (Dormitory)', example: '3.5' },

    // --- 勾選框 (Checkboxes) ---
    { key: 'chk_dorm', label: '有住宿', category: '勾選框 (Checkboxes)', example: '☑' },
    { key: 'chk_self_arranged', label: '自行安排住宿', category: '勾選框 (Checkboxes)', example: '☐' },
    { key: 'chk_dorm', label: '有住宿', category: '勾選框 (Checkboxes)', example: '☑' },
    { key: 'chk_self_arranged', label: '自行安排住宿', category: '勾選框 (Checkboxes)', example: '☐' },
    { key: 'chk_app_recruit_permit', label: '招募函勾選', category: '勾選框 (Checkboxes)', example: '☑' },
    { key: 'chk_app_employ_permit', label: '聘僱許可勾選', category: '勾選框 (Checkboxes)', example: '☐' },
    { key: 'chk_fire_ext', label: '有滅火器', category: '勾選框 (Checkboxes)', example: '☑' },
    { key: 'chk_fire_alarm', label: '有火警探測', category: '勾選框 (Checkboxes)', example: '☑' },

    // --- 系統欄位 (System) ---
    { key: 'today', label: '今日日期', category: '系統欄位 (System)', example: '2024/01/03' },
    { key: 'current_year', label: '當年度', category: '系統欄位 (System)', example: '2024' },
    { key: 'current_month', label: '當月份', category: '系統欄位 (System)', example: '1' },
    { key: 'current_day', label: '當日', category: '系統欄位 (System)', example: '3' },

    // --- 迴圈列表 (Lists) ---
    { key: 'address_history_list', label: '地址變更紀錄', category: '列表 (Lists)', example: '[Array]' },
    { key: 'emergency_contact_list', label: '緊急聯絡人', category: '列表 (Lists)', example: '[Array]' },
    { key: 'workers', label: '移工列表(批次用)', category: '列表 (Lists)', example: '[Array]' },
];

export const getPlaceholderKeys = () => PLACEHOLDERS.map(p => p.key);

export const getPlaceholderByCategory = () => {
    const groups: Record<string, any[]> = {};
    PLACEHOLDERS.forEach(p => {
        if (!groups[p.category]) {
            groups[p.category] = [];
        }
        groups[p.category].push({
            code: `{{${p.key}}}`, // Format for UI
            label: p.label,
            example: p.example
        });
    });

    return Object.keys(groups).map(category => ({
        category,
        fields: groups[category]
    }));
};
