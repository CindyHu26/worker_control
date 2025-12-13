
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Seed Admin User
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const defaultPasswordHash = await bcrypt.hash('change_me', 10);

    const admin = await prisma.internalUser.upsert({
        where: { username: adminUsername },
        update: {
            passwordHash: defaultPasswordHash // Update it if exists too, to fix legacy plain text
        },
        create: {
            username: adminUsername,
            email: adminEmail,
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
    console.log('Seeding document templates...');

    const templates = [
        // Category: entry_packet (新入境套組)
        { name: '勞工保險加保申報表', category: 'entry_packet', filePath: '/templates/entry_packet/labor_insurance_add.docx' },
        { name: '全民健康保險投保申報表', category: 'entry_packet', filePath: '/templates/entry_packet/health_insurance_add.docx' },
        { name: '移工履歷表 (Bio Data)', category: 'entry_packet', filePath: '/templates/entry_packet/bio_data.docx' },
        { name: '工資切結書 (Loan Agreement)', category: 'entry_packet', filePath: '/templates/entry_packet/salary_agreement.docx' },

        // Category: entry_report (入國通報)
        { name: '入國通報申報書', category: 'entry_report', filePath: '/templates/entry_report/entry_report_form.docx' },
        { name: '外國人名冊', category: 'entry_report', filePath: '/templates/entry_report/worker_list.docx' },

        // Category: permit_app (許可函申請)
        { name: '聘僱許可申請書', category: 'permit_app', filePath: '/templates/permit_app/hiring_permit.docx' },
        { name: '居留證申請書', category: 'permit_app', filePath: '/templates/permit_app/arc_application.docx' },

        // Category: contract (勞動契約 Labor Contract)
        { name: 'Labor Contract (VN)', category: 'contract', filePath: '/templates/contract/contract_VN.docx', nationality: 'VN' },
        { name: 'Labor Contract (ID)', category: 'contract', filePath: '/templates/contract/contract_ID.docx', nationality: 'ID' },
        { name: 'Labor Contract (PH)', category: 'contract', filePath: '/templates/contract/contract_PH.docx', nationality: 'PH' },
        { name: 'Labor Contract (TH)', category: 'contract', filePath: '/templates/contract/contract_TH.docx', nationality: 'TH' }
    ];

    for (const t of templates) {


        const exists = await prisma.documentTemplate.findFirst({ where: { name: t.name, category: t.category } });
        if (!exists) {
            await prisma.documentTemplate.create({
                data: {
                    name: t.name,
                    category: t.category,
                    filePath: t.filePath,
                    nationality: (t as any).nationality, // Optional
                    isActive: true
                }
            });
            console.log(`Created template: ${t.name}`);
        } else {
            // Optional: Update path if needed
            await prisma.documentTemplate.update({
                where: { id: exists.id },
                data: { filePath: t.filePath }
            });
            console.log(`Updated template: ${t.name}`);
        }
    }

    // 4. Seed Fee Items (Nationality Specific)
    console.log('Seeding fee items...');
    const feeItems = [
        // Medical Checkup
        { name: 'Medical Checkup (VN)', defaultAmount: 2000, category: 'official_fee', nationality: 'VN', description: 'Standard check for VN workers' },
        { name: 'Medical Checkup (ID)', defaultAmount: 2500, category: 'official_fee', nationality: 'ID', description: 'Standard check for ID workers' },
        { name: 'Medical Checkup (General)', defaultAmount: 2200, category: 'official_fee', nationality: null, description: 'Default checkup fee' },

        // Residence Permit (ARC)
        { name: 'Residence Permit (ARC)', defaultAmount: 1000, category: 'official_fee', nationality: null, description: 'ARC Application Fee' },

        // Labor Contract Verification
        { name: 'Contract Verification (PH)', defaultAmount: 1435, category: 'official_fee', nationality: 'PH', description: 'MECO verification fee' },
        { name: 'Contract Verification (TH)', defaultAmount: 1200, category: 'official_fee', nationality: 'TH', description: 'Thailand Office verification fee' },
        { name: 'Contract Verification (VN)', defaultAmount: 1000, category: 'official_fee', nationality: 'VN', description: 'Vietnam Office verification fee' }
    ];

    for (const f of feeItems) {
        // Check if exists by name AND nationality to allow same name but diff nationality, OR unique name per nationality
        // Ideally name should probably be unique or we check specific combination.
        // Let's assume name is unique enough for this demo or we simply check one.
        const exists = await prisma.feeItem.findFirst({
            where: {
                name: f.name,
                nationality: f.nationality
            }
        });

        if (!exists) {
            await prisma.feeItem.create({
                data: {
                    name: f.name,
                    defaultAmount: f.defaultAmount,
                    category: f.category,
                    nationality: f.nationality,
                    description: f.description
                }
            });
            console.log(`Created Fee Item: ${f.name}`);
        } else {
            // Update amount if changed
            await prisma.feeItem.update({
                where: { id: exists.id },
                data: { defaultAmount: f.defaultAmount }
            });
            console.log(`Updated Fee Item: ${f.name}`);
        }
    }

    // 5. System Settings
    console.log('System initialized.');
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
