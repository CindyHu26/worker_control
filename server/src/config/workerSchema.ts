
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
    name: 'nationalityId', // Changed from nationality string to ID for relation, but frontend might select ID
    label: '國籍',
    type: 'select',
    required: true,
    core: true,
    group: 'basic',
    options: [
      // In a real app, these might come from a separate API call or be injected
    ]
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
  
  // --- Address (Core) ---
  {
    name: 'foreignAddress', // Note: schema has split fields but simple form uses one? Let's check schema.
    // Schema has: foreignCity, foreignDistrict, foreignAddressDetail.
    // For now, let's map to 'foreignFullAddress' or just 'foreignAddressDetail' if we want simple.
    // Let's assume we map to 'foreignAddressDetail' for the simple input.
    label: '國外地址',
    type: 'text',
    core: true,
    group: 'basic'
    // actually schema mapping logic needs to handle this. 
    // If core=true, it expects `worker[name]`.
  },

  // --- Dynamic Attributes (JSONB) ---
  // These are examples of fields that might NOT be in the core schema directly
  // or are currently in schema but we want to fail-over to JSON if removed?
  // No, let's add some NEW fields that are definitely Regulation-based.
  
  {
      name: 'vaccineStage',
      label: '疫苗劑次',
      type: 'select',
      core: false, // Stored in attributes
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
