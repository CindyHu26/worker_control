import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting ReceivableItem verification...');

    const code = `RX_${Date.now().toString().slice(-10)}`;

    // 1. Create Item
    const item = await prisma.receivableItem.create({
        data: {
            code: code,
            nameZh: '測試體檢費',
            nameEn: 'Test Medical Checkup',
            itemCategory: 'medical',
            isDailyCalculation: false,
        },
    });
    console.log('Created Item:', item.id);

    // 2. Create Pricing Rules
    // Rule A: VN workers = 2000
    await prisma.receivablePricingRule.create({
        data: {
            itemId: item.id,
            nationality: 'VN',
            amount: 2000,
            description: 'VN Price',
        },
    });

    // Rule B: ID workers = 1500
    await prisma.receivablePricingRule.create({
        data: {
            itemId: item.id,
            nationality: 'ID',
            amount: 1500,
            description: 'ID Price',
        },
    });

    console.log('Created Pricing Rules');

    // 3. Verify Logic
    const vnRule = await prisma.receivablePricingRule.findFirst({
        where: { itemId: item.id, nationality: 'VN' },
    });

    const idRule = await prisma.receivablePricingRule.findFirst({
        where: { itemId: item.id, nationality: 'ID' },
    });

    if (Number(vnRule?.amount) !== 2000) throw new Error('VN Price Mismatch');
    if (Number(idRule?.amount) !== 1500) throw new Error('ID Price Mismatch');

    console.log('Verification Successful!');

    // 4. Cleanup
    await prisma.receivableItem.delete({
        where: { id: item.id },
    });
    console.log('Cleanup Successful');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
