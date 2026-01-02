
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Rent and WorkTitles...');

    // 1. Rent (BillingItemDefinition)
    await prisma.billingItemDefinition.upsert({
        where: { code: 'RENT' },
        update: {},
        create: {
            code: 'RENT',
            name: '房租',
            nameEn: 'Rent',
            category: 'DORMITORY_FEE',
            isSystem: true,
            sortOrder: 8
        }
    });
    console.log('✅ Billing Item: Rent seeded');

    // 2. WorkTitles
    const manufacturingCat = await prisma.applicationCategory.findUnique({ where: { code: 'MANUFACTURING' } });
    const homeCareCat = await prisma.applicationCategory.findUnique({ where: { code: 'HOME_CARE' } });

    if (manufacturingCat) {
        await prisma.workTitle.upsert({
            where: { categoryId_code: { categoryId: manufacturingCat.id, code: 'FACTORY_WORKER' } },
            update: {},
            create: {
                categoryId: manufacturingCat.id,
                code: 'FACTORY_WORKER',
                titleZh: '製造工',
                titleEn: 'Factory Worker',
                isIntermediate: false
            }
        });
        console.log('✅ Work Title: Factory Worker seeded');
    }

    if (homeCareCat) {
        await prisma.workTitle.upsert({
            where: { categoryId_code: { categoryId: homeCareCat.id, code: 'CARETAKER' } },
            update: {},
            create: {
                categoryId: homeCareCat.id,
                code: 'CARETAKER',
                titleZh: '家庭看護工',
                titleEn: 'Caretaker',
                isIntermediate: false
            }
        });
        console.log('✅ Work Title: Caretaker seeded');
    }
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
