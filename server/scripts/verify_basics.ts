
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verification Start ---');

    const industries = await prisma.industry.count();
    console.log(`Industries: ${industries}`);

    const workTitles = await prisma.workTitle.count();
    console.log(`WorkTitles: ${workTitles}`);

    const billingItems = await prisma.billingItemDefinition.count();
    console.log(`BillingItems (Definitions): ${billingItems}`);

    // Check specific Billing Item "Rent" (房租)
    const rentItem = await prisma.billingItemDefinition.findFirst({
        where: {
            OR: [
                { name: { contains: 'Rent' } },
                { name: { contains: '房租' } }
            ]
        }
    });
    console.log(`Rent Item Found: ${!!rentItem}`);

    const domesticAgencies = await prisma.domesticAgency.count();
    console.log(`DomesticAgencies: ${domesticAgencies}`);

    const partnerAgencies = await prisma.partnerAgency.count();
    console.log(`PartnerAgencies: ${partnerAgencies}`);

    console.log('--- Verification End ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
