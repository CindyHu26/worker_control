import { FieldConfig } from '../types/form-config';

export const WORKER_FORM_CONFIG: FieldConfig[] = [
    // --- Core Fields ---
    {
        name: 'englishName',
        label: '英文姓名',
        type: 'text',
        isCore: true,
        group: 'basic',
        validation: { required: true }
    },
    {
        name: 'nationalityId', // Mapping to 'nationality' concept but using ID for relation
        label: '國籍',
        type: 'select',
        isCore: true,
        group: 'basic',
        // Options would typically be loaded dynamically or hardcoded here if static
        options: [
            { label: '印尼', value: 'ID' },
            { label: '越南', value: 'VN' },
            { label: '菲律賓', value: 'PH' },
            { label: '泰國', value: 'TH' }
        ],
        validation: { required: true }
    },
    {
        name: 'passportNo',
        label: '護照號碼',
        type: 'text',
        isCore: true,
        group: 'passport',
        validation: { required: true }
    },

    // --- Dynamic Attributes ---
    {
        name: 'height',
        label: '身高 (cm)',
        type: 'number',
        isCore: false,
        group: 'personal',
        validation: { min: 0, max: 250 }
    },
    {
        name: 'weight',
        label: '體重 (kg)',
        type: 'number',
        isCore: false,
        group: 'personal',
        validation: { min: 0, max: 200 }
    },
    {
        name: 'religion',
        label: '宗教信仰',
        type: 'select',
        isCore: false,
        group: 'personal',
        options: [
            { label: '無', value: 'NONE' },
            { label: '伊斯蘭教', value: 'ISLAM' },
            { label: '基督/天主', value: 'CHRISTIAN' },
            { label: '佛教', value: 'BUDDHISM' },
            { label: '其她', value: 'OTHER' }
        ]
    },
    {
        name: 'mobile',
        label: '手機號碼',
        type: 'text',
        isCore: false,
        group: 'basic'
    }
];
