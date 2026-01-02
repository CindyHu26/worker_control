
export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number' | 'text-area';
  required?: boolean;
  core?: boolean; // If true, maps to a direct column on the Worker table. If false/undefined, maps to attributes JSON.
  options?: { label: string; value: string }[]; // For select types
  placeholder?: string;
  group: 'basic' | 'passport' | 'deployment' | 'personal' | 'health';
  validation?: any; // Zod-like validation rules can be described here if needed for frontend reinforcement
}

export const workerFormSchema: FieldDefinition[] = [
  // --- Basic Info (Core) ---
  {
    name: 'englishName',
    label: '英文姓名',
    type: 'text',
    required: true,
    core: true,
    group: 'basic',
    placeholder: 'JOHN DOE'
  },
  {
    name: 'chineseName',
    label: '中文姓名',
    type: 'text',
    core: true,
    group: 'basic',
    placeholder: '約翰'
  },
  {
    name: 'nationalityId',
    label: '國籍',
    type: 'select',
    required: true,
    core: true,
    group: 'basic',
    options: [] // Populated by frontend or API
  },
  {
    name: 'dob',
    label: '出生日期',
    type: 'date',
    core: true,
    group: 'basic'
  },
  {
    name: 'gender',
    label: '性別',
    type: 'select',
    core: true,
    group: 'basic',
    options: [
      { label: '男性', value: 'Male' },
      { label: '女性', value: 'Female' }
    ]
  },
  {
    name: 'mobilePhone',
    label: '手機號碼',
    type: 'text',
    core: true,
    group: 'basic'
  },

  // --- Address (Foreign) ---
  {
    name: 'foreignCity',
    label: '國外地址 (城市)',
    type: 'text',
    core: true,
    group: 'basic'
  },
  {
    name: 'foreignDistrict',
    label: '國外地址 (區域)',
    type: 'text',
    core: true,
    group: 'basic'
  },
  {
    name: 'foreignAddressDetail',
    label: '國外路段地址',
    type: 'text', // text-area?
    core: true,
    group: 'basic'
  },
  /*
  {
    name: 'foreignZipCode',
    label: '郵遞區號 (國外)',
    type: 'text',
    core: true,
    group: 'basic'
  },
  */

  // --- Passport Info ---
  {
    name: 'passportNumber',
    label: '護照號碼',
    type: 'text',
    core: true, // Handled by route logic
    group: 'passport',
    required: true
  },
  {
    name: 'passportIssueDate',
    label: '發照日期',
    type: 'date',
    core: true,
    group: 'passport'
  },
  {
    name: 'passportExpiryDate',
    label: '到期日期',
    type: 'date',
    core: true,
    group: 'passport'
  },

  // --- Deployment Info ---
  {
    name: 'contractStartDate',
    label: '派遣日期 (合約起始)',
    type: 'date',
    core: true,
    group: 'deployment'
  },
  {
    name: 'contractEndDate',
    label: '合約到期日',
    type: 'date',
    core: true,
    group: 'deployment'
  },

  // --- Dynamic Attributes (Health / Personal) ---
  {
    name: 'vaccineStage',
    label: '疫苗劑次',
    type: 'select',
    core: false,
    group: 'health',
    options: [
      { label: '未施打', value: '0' },
      { label: '第一劑', value: '1' },
      { label: '第二劑', value: '2' },
      { label: '第三劑', value: '3' },
      { label: '第四劑', value: '4' }
    ]
  },
  {
    name: 'epidemicHotel',
    label: '防疫旅館',
    type: 'text',
    core: false,
    group: 'health',
    placeholder: '請輸入旅館名稱'
  },
  {
    name: 'height',
    label: '身高 (cm)',
    type: 'number',
    core: true,
    group: 'personal'
  },
  {
    name: 'weight',
    label: '體重 (kg)',
    type: 'number',
    core: true,
    group: 'personal'
  }
];
