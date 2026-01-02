import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ==========================================
// Universal Entity Schema Seed Data
// ==========================================

interface EntitySchemaInput {
    entityCode: string;
    fieldName: string;
    label: string;
    fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
    isCore: boolean;
    options?: { label: string; value: string }[];
    validation?: Record<string, unknown>;
    fieldOrder: number;
    fieldGroup?: string;
}


// Worker Entity Schema - Migrated from WORKER_FORM_CONFIG
const workerSchemaFields: EntitySchemaInput[] = [
    // --- Core Fields (Physical SQL columns) ---
    {
        entityCode: 'worker',
        fieldName: 'englishName',
        label: '英文姓名',
        fieldType: 'text',
        isCore: true,
        fieldGroup: 'basic',
        fieldOrder: 1,
        validation: { required: true },
    },
    {
        entityCode: 'worker',
        fieldName: 'nationalityId',
        label: '國籍',
        fieldType: 'select',
        isCore: true,
        fieldGroup: 'basic',
        fieldOrder: 2,
        options: [
            { label: '印尼', value: 'ID' },
            { label: '越南', value: 'VN' },
            { label: '菲律賓', value: 'PH' },
            { label: '泰國', value: 'TH' },
        ],
        validation: { required: true },
    },
    {
        entityCode: 'worker',
        fieldName: 'passportNo',
        label: '護照號碼',
        fieldType: 'text',
        isCore: true,
        fieldGroup: 'passport',
        fieldOrder: 3,
        validation: { required: true },
    },

    // --- Dynamic Attributes (JSONB) ---
    {
        entityCode: 'worker',
        fieldName: 'height',
        label: '身高 (cm)',
        fieldType: 'number',
        isCore: false,
        fieldGroup: 'personal',
        fieldOrder: 10,
        validation: { min: 0, max: 250 },
    },
    {
        entityCode: 'worker',
        fieldName: 'weight',
        label: '體重 (kg)',
        fieldType: 'number',
        isCore: false,
        fieldGroup: 'personal',
        fieldOrder: 11,
        validation: { min: 0, max: 200 },
    },
    {
        entityCode: 'worker',
        fieldName: 'religion',
        label: '宗教信仰',
        fieldType: 'select',
        isCore: false,
        fieldGroup: 'personal',
        fieldOrder: 12,
        options: [
            { label: '無', value: 'NONE' },
            { label: '伊斯蘭教', value: 'ISLAM' },
            { label: '基督/天主', value: 'CHRISTIAN' },
            { label: '佛教', value: 'BUDDHISM' },
            { label: '其她', value: 'OTHER' },
        ],
    },
    {
        entityCode: 'worker',
        fieldName: 'mobile',
        label: '手機號碼',
        fieldType: 'text',
        isCore: false,
        fieldGroup: 'basic',
        fieldOrder: 4,
    },
];

// Employer Entity Schema - Sample fields
const employerSchemaFields: EntitySchemaInput[] = [
    // --- Core Fields (Physical SQL columns) ---
    {
        entityCode: 'employer',
        fieldName: 'companyName',
        label: '公司名稱',
        fieldType: 'text',
        isCore: true,
        fieldGroup: 'basic',
        fieldOrder: 1,
        validation: { required: true },
    },
    {
        entityCode: 'employer',
        fieldName: 'taxId',
        label: '統一編號',
        fieldType: 'text',
        isCore: true,
        fieldGroup: 'basic',
        fieldOrder: 2,
        validation: { required: true, pattern: '^[0-9]{8}$' },
    },
    {
        entityCode: 'employer',
        fieldName: 'companyType',
        label: '公司類型',
        fieldType: 'select',
        isCore: true,
        fieldGroup: 'basic',
        fieldOrder: 3,
        options: [
            { label: '製造業', value: 'MANUFACTURING' },
            { label: '營建業', value: 'CONSTRUCTION' },
            { label: '農漁業', value: 'AGRICULTURE' },
            { label: '機構看護', value: 'INSTITUTION' },
            { label: '家庭看護', value: 'HOME_CARE' },
        ],
        validation: { required: true },
    },

    // --- Dynamic Attributes (JSONB) ---
    {
        entityCode: 'employer',
        fieldName: 'contactPerson',
        label: '聯絡人',
        fieldType: 'text',
        isCore: false,
        fieldGroup: 'contact',
        fieldOrder: 10,
    },
    {
        entityCode: 'employer',
        fieldName: 'contactPhone',
        label: '聯絡電話',
        fieldType: 'text',
        isCore: false,
        fieldGroup: 'contact',
        fieldOrder: 11,
    },
    {
        entityCode: 'employer',
        fieldName: 'notes',
        label: '備註',
        fieldType: 'textarea',
        isCore: false,
        fieldGroup: 'other',
        fieldOrder: 20,
    },
];

async function seedEntitySchemas() {
    console.log('🌱 Seeding EntitySchema table...');

    const allSchemaFields = [...workerSchemaFields, ...employerSchemaFields];

    for (const field of allSchemaFields) {
        const optionsJson = field.options ? (field.options as Prisma.InputJsonValue) : Prisma.DbNull;
        const validationJson = field.validation ? (field.validation as Prisma.InputJsonValue) : Prisma.DbNull;

        await prisma.entitySchema.upsert({
            where: {
                entityCode_fieldName: {
                    entityCode: field.entityCode,
                    fieldName: field.fieldName,
                },
            },
            update: {
                label: field.label,
                fieldType: field.fieldType,
                isCore: field.isCore,
                options: optionsJson,
                validation: validationJson,
                fieldOrder: field.fieldOrder,
                fieldGroup: field.fieldGroup ?? null,
            },
            create: {
                entityCode: field.entityCode,
                fieldName: field.fieldName,
                label: field.label,
                fieldType: field.fieldType,
                isCore: field.isCore,
                options: optionsJson,
                validation: validationJson,
                fieldOrder: field.fieldOrder,
                fieldGroup: field.fieldGroup ?? null,
            },
        });
    }

    console.log(`✅ Seeded ${allSchemaFields.length} EntitySchema records.`);
    console.log(`   - Worker fields: ${workerSchemaFields.length}`);
    console.log(`   - Employer fields: ${employerSchemaFields.length}`);
}

async function main() {
    try {
        await seedEntitySchemas();
    } catch (error) {
        console.error('❌ Error seeding EntitySchema:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();
