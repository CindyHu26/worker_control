

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedIndustries } from './seed_industries';

const prisma = new PrismaClient();

async function main() {
    // 1. Seed Admin User
    const adminUsername = 'admin';
    const defaultPasswordHash = await bcrypt.hash('change_me', 10);

    const admin = await prisma.internalUser.upsert({
        where: { username: adminUsername },
        update: {
            passwordHash: defaultPasswordHash,
            name: '系統管理員'
        },
        create: {
            username: adminUsername,
            name: '系統管理員',
            passwordHash: defaultPasswordHash,
            role: 'admin'
        }
    });

    console.log({ admin });

    // 2. Seed Taiwan Major Cities (Example for Dropdown Data if stored in separate table, 
    // currently we don't have a Cities table but we can log that we are ready)
    console.log('Seeding initial data...');

    // Example: Default Nationality (If referenced dynamic) - currently Enum.

    // 3. Document Templates
    /*
    console.log('Seeding document templates...');
    const templates = [
        ...
    ];
    for (const t of templates) { ... }
    */

    // 4. Seed Fee Items (Nationality Specific)
    /*
    console.log('Seeding fee items...');
    const feeItems = [ ... ];
    for (const f of feeItems) { ... }
    */

    // 5. Seed Insurance Tiers
    /*
    console.log('Seeding insurance tiers...');
    const tiers = [ ... ];
    for (const t of tiers) { ... }
    */

    // 6. Seed Tax Configurations
    console.log('Seeding tax configurations...');
    const taxConfigs = [
        {
            year: 2023,
            minWage: 26400,
            minWageThresholdMultiplier: 1.5,
            standardDeduction: 124000,
            salaryDeduction: 207000,
            personalExemption: 92000,
            taxRateResident: 0.05,
            nonResidentLowRate: 0.06,
            nonResidentHighRate: 0.18,
            effectiveDate: new Date('2023-01-01'),
            notes: '2023 tax parameters'
        },
        {
            year: 2024,
            minWage: 27470,
            minWageThresholdMultiplier: 1.5,
            standardDeduction: 124000,
            salaryDeduction: 207000,
            personalExemption: 92000,
            taxRateResident: 0.05,
            nonResidentLowRate: 0.06,
            nonResidentHighRate: 0.18,
            effectiveDate: new Date('2024-01-01'),
            notes: '2024 minimum wage increased to 27,470'
        },
        {
            year: 2025,
            minWage: 28590,
            minWageThresholdMultiplier: 1.5,
            standardDeduction: 124000,
            salaryDeduction: 207000,
            personalExemption: 92000,
            taxRateResident: 0.05,
            nonResidentLowRate: 0.06,
            nonResidentHighRate: 0.18,
            effectiveDate: new Date('2025-01-01'),
            notes: '2025 projected minimum wage (update when official)'
        }
    ];

    for (const config of taxConfigs) {
        await prisma.taxConfig.upsert({
            where: { year: config.year },
            update: config,
            create: config
        });
        console.log(`✅ Tax configuration for ${config.year} seeded`);
    }

    // 7. System Settings
    console.log('System initialized.');

    // 8. Compliance Rules (New)
    console.log('Seeding compliance rules...');
    const rules = [
        { code: 'DORM_MIN_AREA_PER_PERSON', value: '3.6', category: 'DORM', description: 'Minimum internal area per person (sq meters)' },
        { code: 'FIRE_SAFETY_WARNING_DAYS', value: '30', category: 'SAFETY', description: 'Days before expiry to trigger warning' }
    ];

    for (const r of rules) {
        await prisma.complianceRule.upsert({
            where: { code: r.code },
            update: { value: r.value, category: r.category, description: r.description },
            create: { code: r.code, value: r.value, category: r.category, description: r.description }
        });
        console.log(`✅ Compliance Rule ${r.code} seeded`);
    }

    // 9. Reference Data (通用下拉選單資料)
    console.log('Seeding reference data...');
    const referenceData = [
        // Contract Types
        { category: 'BUSINESS_CONTRACT_TYPE', code: 'FULL_SERVICE', label: '全權委託 (Full Service)', labelEn: 'Full Service', sortOrder: 1, isSystem: false },
        { category: 'BUSINESS_CONTRACT_TYPE', code: 'DOCUMENT_ONLY', label: '單辦文件 (Document Only)', labelEn: 'Document Only', sortOrder: 2, isSystem: false },
        { category: 'BUSINESS_CONTRACT_TYPE', code: 'CONSULTING', label: '顧問服務 (Consulting)', labelEn: 'Consulting', sortOrder: 3, isSystem: false },
        // Recruitment Types per Taiwan MOL regulations (system protected)
        { category: 'RECRUITMENT_TYPE', code: 'INITIAL', label: '初次招募', labelEn: 'Initial Recruitment', sortOrder: 1, isSystem: true },
        { category: 'RECRUITMENT_TYPE', code: 'RE_RECRUIT', label: '重新招募', labelEn: 'Re-Recruitment', sortOrder: 2, isSystem: true },
        { category: 'RECRUITMENT_TYPE', code: 'REPLACEMENT', label: '遞補', labelEn: 'Replacement', sortOrder: 3, isSystem: true },
        // Nationalities (system protected)
        { category: 'NATIONALITY', code: 'TH', label: '泰國', labelEn: 'Thailand', sortOrder: 1, isSystem: true },
        { category: 'NATIONALITY', code: 'PH', label: '菲律賓', labelEn: 'Philippines', sortOrder: 2, isSystem: true },
        { category: 'NATIONALITY', code: 'VN', label: '越南', labelEn: 'Vietnam', sortOrder: 3, isSystem: true },
        { category: 'NATIONALITY', code: 'ID', label: '印尼', labelEn: 'Indonesia', sortOrder: 4, isSystem: true },
        // Document Template Types (Phase 4 - Entry Workflow)
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_ENTRY_NOTIFICATION', label: '入國通報書', labelEn: 'Entry Notification', sortOrder: 1, isSystem: true },
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_RESIDENCE_PERMIT_APP', label: '居留證申請書', labelEn: 'Residence Permit Application', sortOrder: 2, isSystem: true },
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_EMPLOYMENT_PERMIT_APP', label: '聘僱許可申請書', labelEn: 'Employment Permit Application', sortOrder: 3, isSystem: true },
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_LABOR_INSURANCE_ADD', label: '勞保加保單', labelEn: 'Labor Insurance Enrollment', sortOrder: 4, isSystem: true },
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_HEALTH_INSURANCE_ADD', label: '健保加保單', labelEn: 'Health Insurance Enrollment', sortOrder: 5, isSystem: true },
        { category: 'DOCUMENT_TEMPLATE_TYPE', code: 'DOC_AIRPORT_CARE', label: '機場關懷單', labelEn: 'Airport Care Form', sortOrder: 6, isSystem: true },
    ];

    for (const ref of referenceData) {
        await prisma.referenceData.upsert({
            where: { category_code: { category: ref.category, code: ref.code } },
            update: { label: ref.label, labelEn: ref.labelEn, sortOrder: ref.sortOrder, isSystem: ref.isSystem },
            create: ref
        });
        console.log(`✅ Reference Data ${ref.category}/${ref.code} seeded`);
    }

    // 10. Billing Item Definitions (費用項目定義)
    console.log('Seeding billing item definitions...');
    const billingItems = [
        {
            code: 'SERVICE_FEE',
            name: '服務費',
            nameEn: 'Service Fee',
            category: 'SERVICE_FEE' as const,
            isSystem: true,
            sortOrder: 1
        },
        {
            code: 'ARC_FEE',
            name: '居留證費',
            nameEn: 'ARC Fee',
            category: 'ARC_FEE' as const,
            isSystem: true,
            sortOrder: 2
        },
        {
            code: 'HEALTH_CHECK_FEE',
            name: '體檢費',
            nameEn: 'Medical Examination Fee',
            category: 'HEALTH_CHECK_FEE' as const,
            isSystem: true,
            sortOrder: 3
        },
        {
            code: 'STABILIZATION_FEE',
            name: '就業安定費',
            nameEn: 'Employment Stabilization Fee',
            category: 'STABILIZATION_FEE' as const,
            isSystem: true,
            sortOrder: 4
        },
        {
            code: 'DORMITORY_FEE',
            name: '膳宿費',
            nameEn: 'Dormitory Fee',
            category: 'DORMITORY_FEE' as const,
            isSystem: true,
            sortOrder: 5
        },
        {
            code: 'INSURANCE_FEE',
            name: '保險費',
            nameEn: 'Insurance Fee',
            category: 'INSURANCE_FEE' as const,
            isSystem: true,
            sortOrder: 6
        },
        {
            code: 'AIRPORT_PICKUP',
            name: '接機費',
            nameEn: 'Airport Pickup Fee',
            category: 'AIRPORT_PICKUP' as const,
            isSystem: true,
            sortOrder: 7
        },
        {
            code: 'RENT',
            name: '房租',
            nameEn: 'Rent',
            category: 'DORMITORY_FEE' as const,
            isSystem: true,
            sortOrder: 8
        }
    ];

    for (const item of billingItems) {
        await prisma.billingItemDefinition.upsert({
            where: { code: item.code },
            update: {
                name: item.name,
                nameEn: item.nameEn,
                category: item.category,
                isSystem: item.isSystem,
                sortOrder: item.sortOrder
            },
            create: item
        });
        console.log(`✅ Billing Item ${item.code} - ${item.name} seeded`);
    }

    // 10. Reference Data: Application Categories (申請項目)
    console.log('Seeding application categories...');
    const categories = [
        {
            code: 'MANUFACTURING',
            nameZh: '製造工作',
            nameEn: 'Manufacturing Work',
            type: 'BUSINESS' as const,
            iconName: 'Factory',
            color: 'blue',
            description: '適用於一般製造業工廠，需具備工廠登記證',
            quotaBaseRate: 0.20,
            sortOrder: 1
        },
        {
            code: 'CONSTRUCTION',
            nameZh: '營造工作',
            nameEn: 'Construction Work',
            type: 'BUSINESS' as const,
            iconName: 'HardHat',
            color: 'orange',
            description: '適用於重大公共工程或一般營造工程',
            quotaBaseRate: 0.40,
            sortOrder: 2
        },
        {
            code: 'FISHERY',
            nameZh: '海洋漁撈工作',
            nameEn: 'Fishing Work',
            type: 'BUSINESS' as const,
            iconName: 'Ship',
            color: 'cyan',
            description: '適用於海洋漁撈作業',
            sortOrder: 3
        },
        {
            code: 'HOME_CARE',
            nameZh: '家庭看護工作',
            nameEn: 'Home Caregiver',
            type: 'INDIVIDUAL' as const,
            iconName: 'UserHeart',
            color: 'pink',
            description: '照顧身心障礙者或重大傷病者',
            sortOrder: 4
        },
        {
            code: 'HOME_HELPER',
            nameZh: '家庭幫傭工作',
            nameEn: 'Home Helper',
            type: 'INDIVIDUAL' as const,
            iconName: 'Home',
            color: 'purple',
            description: '協助家庭處理家務與照顧幼童',
            sortOrder: 5
        },
        {
            code: 'INSTITUTION',
            nameZh: '機構看護工作',
            nameEn: 'Institutional Caregiver',
            type: 'INSTITUTION' as const,
            iconName: 'Building2',
            color: 'green',
            description: '適用於立案之養護機構',
            sortOrder: 6
        },
        {
            code: 'AGRICULTURE_FARMING',
            nameZh: '農業工作 (農糧/畜牧/養殖)',
            nameEn: 'Agriculture Farming',
            type: 'BUSINESS' as const,
            iconName: 'Wheat',
            color: 'lime',
            description: '農糧、畜牧、養殖業工作',
            sortOrder: 7
        },
        {
            code: 'AGRICULTURE_OUTREACH',
            nameZh: '外展農務工作',
            nameEn: 'Outreach Agriculture',
            type: 'BUSINESS' as const,
            iconName: 'Tractor',
            color: 'emerald',
            description: '外展農務服務',
            sortOrder: 8
        },
        // 中階技術人力
        {
            code: 'MID_MANUFACTURING',
            nameZh: '中階技術製造工作',
            nameEn: 'Intermediate Skilled Manufacturing',
            type: 'BUSINESS' as const,
            iconName: 'Cog',
            color: 'indigo',
            description: '中階技術製造人力',
            sortOrder: 10
        },
        {
            code: 'MID_CONSTRUCTION',
            nameZh: '中階技術營造工作',
            nameEn: 'Intermediate Skilled Construction',
            type: 'BUSINESS' as const,
            iconName: 'Wrench',
            color: 'amber',
            description: '中階技術營造人力',
            sortOrder: 11
        },
        {
            code: 'MID_INSTITUTION',
            nameZh: '中階技術機構看護',
            nameEn: 'Intermediate Skilled Institutional Care',
            type: 'INSTITUTION' as const,
            iconName: 'Heart',
            color: 'rose',
            description: '中階技術機構看護人力',
            sortOrder: 12
        }
    ];

    for (const cat of categories) {
        await prisma.applicationCategory.upsert({
            where: { code: cat.code },
            update: {
                nameZh: cat.nameZh,
                nameEn: cat.nameEn,
                type: cat.type,
                iconName: cat.iconName,
                color: cat.color,
                description: cat.description,
                quotaBaseRate: cat.quotaBaseRate,
                sortOrder: cat.sortOrder
            },
            create: {
                ...cat,
                type: cat.type
            }
        });
        console.log(`✅ Application Category ${cat.code} seeded`);
    }

    // 10. Reference Data: Industries (ROC 行業標準分類)
    console.log('Seeding industries from JSON...');
    const industriesCount = await seedIndustries(prisma);
    console.log(`✅ ${industriesCount} industries seeded`);

    // 11. Reference Data: Application Types (Deprecated / Model missing)
    /*
    console.log('Seeding application types...');
    const appTypes = [
        { code: '1', nameZh: '製造業勞工', nameEn: 'Manufacturing Worker', sortOrder: 1 },
        { code: '2', nameZh: '營造業勞工', nameEn: 'Construction Worker', sortOrder: 2 },
        { code: '3', nameZh: '家庭看護工', nameEn: 'Home Care Worker', sortOrder: 3 },
        { code: '4', nameZh: '家庭幫傭', nameEn: 'Domestic Helper', sortOrder: 4 },
        { code: '61', nameZh: '護理之家看護工', nameEn: 'Nursing Home Care Worker', sortOrder: 5 },
        { code: '6', nameZh: '養護機構看護工', nameEn: 'Care Institution Worker', sortOrder: 6 }
    ];

    for (const type of appTypes) {
        // await prisma.applicationType.upsert({ ... });
        // Model ApplicationType does not exist in schema
    }
    */

    // 11. Reference Data: Industry Codes (Handled by seedIndustries or Model missing)
    /*
    console.log('Seeding industry codes manually...');
    const industryCodes = [
        { code: '08', nameZh: '食品及飼品製造業', nameEn: 'Food Manufacturing', sortOrder: 1 },
        // ... (truncated)
        { code: '33', nameZh: '其他製造業', nameEn: 'Other Manufacturing', sortOrder: 26 }
    ];

    for (const industry of industryCodes) {
        // await prisma.industryCode.upsert({ ... });
        // Model IndustryCode does not exist in schema
    }
    */

    // 12. Reference Data: Domestic Agencies
    console.log('Seeding domestic agencies...');
    const domesticAgencies = [
        {
            code: '01',
            agencyNameZh: '範例人力仲介股份有限公司',
            agencyNameEn: 'EXAMPLE MANPOWER CO.,LTD.',
            agencyNameShort: '範例人力',
            phone: '02-23456789',
            fax: '02-23456780',
            emergencyEmail: 'emergency@example.com',
            zipCode: '100',
            city: '台北市',
            district: '中正區',
            addressDetail: '中山南路1號',
            fullAddress: '台北市中正區中山南路1號',
            fullAddressEn: 'No.1, Zhongshan S. Rd., Zhongzheng Dist., Taipei City 100, Taiwan (R.O.C.)',
            representativeName: '範例負責人',
            representativeNameEn: 'EXAMPLE REPRESENTATIVE',
            representativeIdNo: 'A123456789',
            taxId: '12345678',
            permitNumber: '0001',
            permitValidFrom: new Date('2025-01-01'),
            permitValidTo: new Date('2027-12-31'),
            customerServicePhone: '02-23456789',
            emergencyPhone: '0900-123456',
            postalAccountName: '範例人力仲介股份有限公司',
            bankName: '範例銀行(台北分行)',
            bankCode: '001',
            bankBranchCode: '0001',
            bankAccountNo: '123456789012',
            bankAccountName: '範例人力仲介股份有限公司',
            accountant: '範例會計',
            sortOrder: 1
        },
        {
            code: '02',
            agencyNameZh: '範例管理顧問股份有限公司',
            agencyNameEn: 'Example Management Consulting Co.,Ltd.',
            agencyNameShort: '範例管顧',
            sortOrder: 2
        },
        {
            code: '03',
            agencyNameZh: '範例國際開發股份有限公司',
            agencyNameEn: 'Example International Development Co.,Ltd.',
            agencyNameShort: '範例國際',
            sortOrder: 3
        }
    ];

    const createdAgencies: any[] = [];
    for (const agency of domesticAgencies) {
        const created = await prisma.domesticAgency.upsert({
            where: { code: agency.code },
            update: agency,
            create: agency
        });
        createdAgencies.push(created);
        console.log(`✅ Domestic Agency ${agency.code} - ${agency.agencyNameShort} seeded`);
    }

    // 13. Reference Data: Bilateral Trade Licenses (for agency 01)
    console.log('Seeding bilateral trade licenses...');
    const agency01 = createdAgencies.find(a => a.code === '01');
    if (agency01) {
        const bilateralLicenses = [
            {
                agencyId: agency01.id,
                country: 'TH', // 泰國
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2025-12-31'),
                status: 'ACTIVE'
            },
            {
                agencyId: agency01.id,
                country: 'PH', // 菲律賓
                validFrom: new Date('2024-06-01'),
                validTo: new Date('2026-05-31'),
                status: 'ACTIVE'
            },
            {
                agencyId: agency01.id,
                country: 'ID', // 印尼
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2025-12-31'),
                status: 'ACTIVE'
            },
            {
                agencyId: agency01.id,
                country: 'VN', // 越南
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2025-12-31'),
                status: 'ACTIVE'
            }
        ];

        for (const license of bilateralLicenses) {
            await prisma.agencyBilateralTradeLicense.create({
                data: license
            });
            console.log(`✅ Bilateral License ${license.country} for ${agency01.agencyNameShort} seeded`);
        }
    }

    // 14. Reference Data: Loan Banks
    console.log('Seeding loan banks...');
    const loanBanks = [
        { code: '0004', nameZh: '玉山銀行', nameEn: 'E.SUN Bank', sortOrder: 1 },
        { code: '0001', nameZh: '華南銀行', nameEn: 'Hua Nan Bank', sortOrder: 2 },
        { code: '0002', nameZh: '中國信託', nameEn: 'CTBC Bank', sortOrder: 3 },
        { code: '003', nameZh: '台新銀行', nameEn: 'Taishin Bank', sortOrder: 4 },
        { code: '05', nameZh: '大眾EPDA', sortOrder: 5 },
        { code: '006', nameZh: '飛盟利', sortOrder: 6 },
        { code: '007', nameZh: '宏融', sortOrder: 7 },
        { code: '008', nameZh: '智惠', sortOrder: 8 },
        { code: '009', nameZh: 'SINARMAS', sortOrder: 9 },
        { code: '8090000', nameZh: '凱基', nameEn: 'KGI Bank', sortOrder: 10 },
        { code: '700', nameZh: '中華郵政', nameEn: 'Chunghwa Post', sortOrder: 11 }
    ];

    for (const bank of loanBanks) {
        await prisma.loanBank.upsert({
            where: { code: bank.code },
            update: bank,
            create: bank
        });
        console.log(`✅ Loan Bank ${bank.code} - ${bank.nameZh} seeded`);
    }

    // 15. Partner Agencies (配合仲介)
    console.log('Seeding partner agencies...');
    const partnerAgencies = [
        {
            code: '16',
            agencyNameZh: '範例國際開發股份有限公司',
            agencyNameZhShort: '範例國際',
            agencyNameEn: 'EXAMPLE INTERNATIONAL DEVELOPMENT CO.,LTD.',
            phone: '04-22248600',
            fax: '04-22248606',
            country: 'VN', // 越南
            countryNameZh: '越南',
            loanBankCode: '0004', // 玉山銀行
            isActive: true
        },
        {
            code: '20',
            agencyNameZh: '菲律賓人力資源公司',
            agencyNameZhShort: '菲律賓人力',
            agencyNameEn: 'Philippines Manpower Agency Inc.',
            phone: '+63-2-1234567',
            country: 'PH', // 菲律賓
            countryNameZh: '菲律賓',
            loanBankCode: '0002', // 中國信託
            isActive: true
        }
    ];

    const createdPartnerAgencies: any[] = [];
    for (const agency of partnerAgencies) {
        const created = await prisma.partnerAgency.upsert({
            where: { code: agency.code },
            update: agency,
            create: agency
        });
        createdPartnerAgencies.push(created);
        console.log(`✅ Partner Agency ${agency.code} - ${agency.agencyNameZhShort} seeded`);
    }

    // 16. Partner Agency Bilateral Licenses
    console.log('Seeding partner agency bilateral licenses...');
    const partnerAgency16 = createdPartnerAgencies.find(a => a.code === '16');
    if (partnerAgency16) {
        const bilateralLicenses = [
            {
                agencyId: partnerAgency16.id,
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2025-12-31'),
                status: 'ACTIVE'
            }
        ];

        for (const license of bilateralLicenses) {
            await prisma.partnerAgencyBilateralLicense.create({
                data: license
            });
            console.log(`✅ Bilateral License for ${partnerAgency16.agencyNameZhShort} seeded`);
        }
    }

    // 17. Partner Agency Contracts
    console.log('Seeding partner agency contracts...');
    const partnerAgency20 = createdPartnerAgencies.find(a => a.code === '20');
    if (partnerAgency20) {
        const contracts = [
            {
                agencyId: partnerAgency20.id,
                contractNo: 'LC-2024-PH-001',
                contractType: '勞工供應契約',
                signedDate: new Date('2024-01-15'),
                validFrom: new Date('2024-02-01'),
                validTo: new Date('2025-01-31'),
                summary: '菲律賓家庭看護工供應合約',
                status: 'ACTIVE'
            }
        ];

        for (const contract of contracts) {
            await prisma.partnerAgencyContract.create({
                data: contract
            });
            console.log(`✅ Contract ${contract.contractNo} for ${partnerAgency20.agencyNameZhShort} seeded`);
        }
    }

    // 18. Banks (銀行基本資料)
    console.log('Seeding banks...');
    const banks = [
        {
            code: '0004',
            bankName: '玉山銀行',
            bankNameEn: 'E.SUN Bank',
            phone: '02-21821313',
            fullAddress: '台北市松山區民生東路三段115號'
        },
        {
            code: '0001',
            bankName: '華南銀行',
            bankNameEn: 'Hua Nan Bank',
            phone: '02-23713111',
            fullAddress: '台北市信義區松仁路123號'
        },
        {
            code: '0002',
            bankName: '中國信託',
            bankNameEn: 'CTBC Bank',
            phone: '02-33277777',
            fullAddress: '台北市南港區經貿二路168號'
        }
    ];

    const createdBanks: any[] = [];
    for (const bank of banks) {
        const created = await prisma.bank.upsert({
            where: { code: bank.code },
            update: bank,
            create: bank
        });
        createdBanks.push(created);
        console.log(`✅ Bank ${bank.code} - ${bank.bankName} seeded`);
    }

    // 19. Domestic Agency Bank Accounts
    console.log('Seeding domestic agency bank accounts...');

    // 取得已創建的國內仲介
    const agency02 = createdAgencies.find(a => a.code === '02'); // 範例管顧
    const agency03 = createdAgencies.find(a => a.code === '03'); // 範例國際

    const bank0004 = createdBanks.find(b => b.code === '0004');
    const bank0001 = createdBanks.find(b => b.code === '0001');
    const bank0002 = createdBanks.find(b => b.code === '0002');

    const agencyBankAccounts = [];

    // 範例人力的銀行帳戶
    if (agency01 && bank0004) {
        agencyBankAccounts.push({
            domesticAgencyId: agency01.id,
            bankId: bank0004.id,
            agencyUnitCode: 'EG1234567890',
            agencyAccountNo: '0621234567890',
            accountPurpose: '勞工薪資轉帳專戶',
            isPrimary: true
        });
    }
    if (agency01 && bank0001) {
        agencyBankAccounts.push({
            domesticAgencyId: agency01.id,
            bankId: bank0001.id,
            agencyUnitCode: 'HN9876543210',
            agencyAccountNo: '1239876543210',
            accountPurpose: '備用帳戶',
            isPrimary: false
        });
    }

    // 範例管顧的銀行帳戶
    if (agency02 && bank0004) {
        agencyBankAccounts.push({
            domesticAgencyId: agency02.id,
            bankId: bank0004.id,
            agencyUnitCode: 'MC5555666677',
            agencyAccountNo: '0625555666677',
            accountPurpose: '服務費收款專戶',
            isPrimary: true
        });
    }

    // 範例國際的銀行帳戶
    if (agency03 && bank0002) {
        agencyBankAccounts.push({
            domesticAgencyId: agency03.id,
            bankId: bank0002.id,
            agencyUnitCode: 'ID8888999900',
            agencyAccountNo: '0028888999900',
            accountPurpose: '勞工薪資轉帳專戶',
            isPrimary: true
        });
    }

    for (const account of agencyBankAccounts) {
        await prisma.domesticAgencyBankAccount.upsert({
            where: {
                domesticAgencyId_bankId_agencyAccountNo: {
                    domesticAgencyId: account.domesticAgencyId,
                    bankId: account.bankId,
                    agencyAccountNo: account.agencyAccountNo
                }
            },
            update: account,
            create: account
        });

        const agency = createdAgencies.find(a => a.id === account.domesticAgencyId);
        const bank = createdBanks.find(b => b.id === account.bankId);
        console.log(`✅ Bank Account: ${agency?.agencyNameShort} @ ${bank?.bankName} seeded`);
    }

    // 20. Departments (部門)
    console.log('Seeding departments...');
    const departments = [
        { code: '001', nameZh: '董事長', nameEn: 'Chairman', sortOrder: 1 },
        { code: '002', nameZh: '總經理', nameEn: 'General Manager', sortOrder: 2 },
        { code: '100', nameZh: '業務部', nameEn: 'Sales Department', sortOrder: 3 },
        { code: '200', nameZh: '財務部', nameEn: 'Finance Department', sortOrder: 4 },
        { code: '300', nameZh: '行政部', nameEn: 'Administration Department', sortOrder: 5 },
        { code: '500', nameZh: '客服部', nameEn: 'Customer Service Department', sortOrder: 6 }
    ];

    for (const dept of departments) {
        await prisma.department.upsert({
            where: { code: dept.code },
            update: dept,
            create: dept
        });
        console.log(`✅ Department ${dept.code} - ${dept.nameZh} seeded`);
    }

    // 21. Employees (員工)
    console.log('Seeding employees...');
    const employees = [
        {
            code: '4',
            fullName: '範例業務',
            fullNameEn: 'Example Sales',
            gender: '男',
            nationality: '中華民國',
            dateOfBirth: new Date('1990-01-01'),
            idNumber: 'A123456789',
            departmentCode: '100', // 業務部
            employeeNumber: 'EMP001',
            jobTitle: '資深業務專員',
            domesticAgencyId: agency01?.id,
            phone: '02-23456789',
            mobilePhone: '0900-123456',
            email: 'sales@example.com',
            receiveSms: false,
            mailingCity: '台北市',
            mailingDistrict: '信義區',
            mailingAddressDetail: '信義路五段7號',
            mailingZipCode: '110',
            isSales: true,
            isAdmin: false,
            isCustomerService: false,
            isAccounting: false,
            isBilingual: false,
            hireDate: new Date('2020-03-01'),
            insuranceStartDate: new Date('2020-03-01'),
            isActive: true
        },
        {
            code: '10',
            fullName: '範例客服',
            gender: '男',
            nationality: '中華民國',
            departmentCode: '500', // 客服部
            employeeNumber: 'EMP010',
            jobTitle: '客服專員',
            domesticAgencyId: agency01?.id,
            phone: '02-23456789',
            extension: '101',
            email: 'service@example.com',
            isSales: false,
            isAdmin: false,
            isCustomerService: true,
            isAccounting: false,
            isBilingual: true,
            hireDate: new Date('2021-06-15'),
            insuranceStartDate: new Date('2021-06-15'),
            isActive: true
        }
    ];

    for (const emp of employees) {
        await prisma.employee.upsert({
            where: { code: emp.code },
            update: emp,
            create: emp
        });
        console.log(`✅ Employee ${emp.code} - ${emp.fullName} seeded`);
    }


    // 22. Seed Work Titles (官方工作類別 - 勞工處入國通報申請書標準)
    console.log('Seeding work titles (Official MOL Categories)...');
    const workTitles = [
        { code: '1', titleZh: '製造工作', titleEn: 'Manufacturing Work', isIntermediate: false },
        { code: '2', titleZh: '營造工作', titleEn: 'Construction Work', isIntermediate: false },
        { code: '3', titleZh: '家庭看護工作', titleEn: 'Domestic Caretaker Work', isIntermediate: false },
        { code: '4', titleZh: '家庭幫傭工作', titleEn: 'Domestic Helper Work', isIntermediate: false },
        { code: '5', titleZh: '海洋漁撈工作', titleEn: 'Ocean Fishing Work', isIntermediate: false },
        { code: '6', titleZh: '機構看護工作', titleEn: 'Institutional Caretaker Work', isIntermediate: false },
        { code: '7', titleZh: '屠宰工作', titleEn: 'Slaughtering Work', isIntermediate: false },
        { code: '8', titleZh: '外展農務工作', titleEn: 'Outreach Agricultural Work', isIntermediate: false },
        { code: '9', titleZh: '外展製造工作', titleEn: 'Outreach Manufacturing Work', isIntermediate: false },
        { code: '10', titleZh: '農、林、牧或養殖漁業工作', titleEn: 'Agriculture, Forestry, Livestock or Aquaculture Work', isIntermediate: false },
        { code: '11', titleZh: '中階技術海洋漁撈工作', titleEn: 'Intermediate Skilled Ocean Fishing Work', isIntermediate: true },
        { code: '12', titleZh: '中階技術機構看護工作', titleEn: 'Intermediate Skilled Institutional Caretaker Work', isIntermediate: true },
        { code: '13', titleZh: '中階技術家庭看護工作', titleEn: 'Intermediate Skilled Domestic Caretaker Work', isIntermediate: true },
        { code: '14', titleZh: '中階技術製造工作', titleEn: 'Intermediate Skilled Manufacturing Work', isIntermediate: true },
        { code: '15', titleZh: '中階技術營造工作', titleEn: 'Intermediate Skilled Construction Work', isIntermediate: true },
        { code: '16', titleZh: '中階技術外展農業工作', titleEn: 'Intermediate Skilled Outreach Agricultural Work', isIntermediate: true },
        { code: '17', titleZh: '中階技術農業工作', titleEn: 'Intermediate Skilled Agricultural Work', isIntermediate: true },
    ];

    for (const wt of workTitles) {
        // 使用 code 作為唯一識別，因為官方標準不綁定 ApplicationCategory
        const existing = await prisma.workTitle.findFirst({
            where: { code: wt.code, categoryId: null }
        });

        if (existing) {
            await prisma.workTitle.update({
                where: { id: existing.id },
                data: {
                    titleZh: wt.titleZh,
                    titleEn: wt.titleEn,
                    isIntermediate: wt.isIntermediate
                }
            });
        } else {
            await prisma.workTitle.create({
                data: {
                    code: wt.code,
                    titleZh: wt.titleZh,
                    titleEn: wt.titleEn,
                    isIntermediate: wt.isIntermediate,
                    categoryId: null
                }
            });
        }
        console.log(`✅ Work Title: ${wt.titleZh} seeded`);
    }

    // 23. Seed Contract End Reasons (合約終止原因)
    console.log('Seeding contract end reasons...');
    const contractEndReasons = [
        { code: '3', nameZh: '逃跑', sortOrder: 1 },
        { code: '4', nameZh: '轉出', sortOrder: 2 },
        { code: '411', nameZh: '被看護者-死亡', sortOrder: 3 },
        { code: '412', nameZh: '被看護者-由家人照顧', sortOrder: 4 },
        { code: '413', nameZh: '被看護者-已送照護機構', sortOrder: 5 },
        { code: '414', nameZh: '被看護者-已聘僱本國看護工', sortOrder: 6 },
        { code: '415', nameZh: '被看護者-康復', sortOrder: 7 },
        { code: '416', nameZh: '被看護者-移民', sortOrder: 8 },
        { code: '421', nameZh: '原雇主-死亡', sortOrder: 9 },
        { code: '422', nameZh: '原雇主-移民', sortOrder: 10 },
        { code: '43', nameZh: '漁船被扣押、沉沒或修繕無法作業', sortOrder: 11 },
        { code: '44', nameZh: '關廠歇業或無法依勞動契約給付工作報酬', sortOrder: 12 },
        { code: '45', nameZh: '經濟因素不佳，無法給付工作報酬', sortOrder: 13 },
        { code: '46', nameZh: '業務緊縮或已無工作、照顧需求', sortOrder: 14 },
        { code: '47', nameZh: '家庭外籍看護工經原雇主同意轉換雇主或工作', sortOrder: 15 },
        { code: '48', nameZh: '其他原因轉出', sortOrder: 16 },
        { code: '5', nameZh: '終止委任', sortOrder: 17 },
        { code: '6', nameZh: '轉換仲介', sortOrder: 18 },
        { code: '8', nameZh: '廢止聘可', sortOrder: 19 },
        { code: 'H01', nameZh: '違反就業服務法', sortOrder: 20 },
        { code: 'H02', nameZh: '違反聘僱許可辦法', sortOrder: 21 },
        { code: 'H03', nameZh: '公司業務緊縮', sortOrder: 22 },
        { code: 'H04', nameZh: '工廠關廠、歇業', sortOrder: 23 },
        { code: 'HAA', nameZh: '聘僱期滿', sortOrder: 24 },
        { code: 'HAA1', nameZh: '聘僱期滿-續聘(未出境)', sortOrder: 25 },
        { code: 'HAA2', nameZh: '聘僱期滿-轉換(未出境)', sortOrder: 26 },
        { code: 'HAA3', nameZh: '聘僱期滿-轉中階(未出境)', sortOrder: 27 },
        { code: 'HAA4', nameZh: '中途轉中階(未出境)', sortOrder: 28 },
        { code: 'HAC', nameZh: '聘僱關係終止', sortOrder: 29 },
        { code: 'HB4', nameZh: '定期健檢逾期', sortOrder: 30 },
        { code: 'HC1', nameZh: '行蹤不明-機場', sortOrder: 31 },
        { code: 'HC2', nameZh: '行蹤不明-收容處所', sortOrder: 32 },
        { code: 'HC3', nameZh: '行蹤不明-仲介公司安置處所', sortOrder: 33 },
        { code: 'HC4', nameZh: '行蹤不明-外國人自行居住處所', sortOrder: 34 },
        { code: 'HCO', nameZh: '行蹤不明-雇主處所', sortOrder: 35 },
        { code: 'HCP', nameZh: '無新雇主承接而出國,業經廢止聘僱', sortOrder: 36 },
        { code: 'HCS', nameZh: '家庭看護工已由新雇主接續聘僱', sortOrder: 37 },
        { code: 'HCT', nameZh: '無新雇主承接而出國,未經廢止聘僱', sortOrder: 38 },
        { code: 'HDC', nameZh: '因案在押', sortOrder: 39 },
        { code: 'HDF', nameZh: '定期健檢不合格', sortOrder: 40 },
        { code: 'HEA', nameZh: '初入國健檢逾期', sortOrder: 41 },
        { code: 'HEB', nameZh: '行蹤不明尋獲', sortOrder: 42 },
        { code: 'HEC', nameZh: '初入國健檢不合格-法定傳染病', sortOrder: 43 },
        { code: 'HED', nameZh: '初入國健檢不合格-非法定傳染病', sortOrder: 44 },
        { code: 'HEE', nameZh: '無法勝任', sortOrder: 45 },
        { code: 'HEI', nameZh: '因外國人違反中華民國其他法令, 情節重大者', sortOrder: 46 },
        { code: 'HEO', nameZh: '逾期出國', sortOrder: 47 },
        { code: 'HEP', nameZh: '返鄉未歸', sortOrder: 48 },
        { code: 'HEQ', nameZh: '原機遣返', sortOrder: 49 },
        { code: 'HGE', nameZh: '外勞死亡', sortOrder: 50 },
        { code: 'OTH', nameZh: '其他', sortOrder: 51 },
        { code: 'OTH1', nameZh: '轉換期間屆滿無新雇主承接', sortOrder: 52 },
        { code: 'OTH2', nameZh: '外國人放棄轉換雇主或工作', sortOrder: 53 }
    ];

    for (const reason of contractEndReasons) {
        await prisma.contractEndReason.upsert({
            where: { code: reason.code },
            update: { nameZh: reason.nameZh, sortOrder: reason.sortOrder },
            create: reason
        });
    }
    console.log(`✅ ${contractEndReasons.length} Contract End Reasons seeded`);

}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
