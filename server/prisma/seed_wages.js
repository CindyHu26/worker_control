
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Minimum Wage Configuration...');

    // 1. Clear existing (optional, but good for dev)
    // await prisma.minimumWageConfiguration.deleteMany({});

    // 2. Define Wages for 2024
    const wages2024 = [
        {
            year: 2024,
            effectiveDate: new Date('2024-01-01'),
            processType: 'NON_SPECIAL_PROCESS', // General
            monthlySalary: 27470,
            hourlyWage: 183
        },
        {
            year: 2024,
            effectiveDate: new Date('2024-01-01'),
            processType: 'SPECIAL_PROCESS', // Special (Example: Higher)
            monthlySalary: 29000, // Example value
            hourlyWage: 190
        },
        {
            year: 2024,
            effectiveDate: new Date('2024-01-01'),
            processType: 'DOMESTIC_HELPER', // Domestic Helper
            monthlySalary: 20000,
            hourlyWage: null
        }
    ];

    for (const w of wages2024) {
        const existing = await prisma.minimumWageConfiguration.findFirst({
            where: {
                year: w.year,
                processType: w.processType
            }
        });

        if (!existing) {
            await prisma.minimumWageConfiguration.create({
                data: w
            });
            console.log(`Created wage for ${w.processType}`);
        } else {
            console.log(`Wage for ${w.processType} already exists.`);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
