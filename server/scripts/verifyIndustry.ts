import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Industry & Salary verification...');

    const suffix = Date.now().toString().slice(-6);
    let industryId: string | undefined;

    try {
        // 1. Create Industry (e.g., Code 0116)
        const industry = await prisma.industry.create({
            data: {
                code: `I${suffix}`,
                category: 'A',
                nameZh: '食用菇蕈栽培業',
                nameEn: 'Growing of Mushrooms',
                isOpen: true
            }
        });
        industryId = industry.id;
        console.log(`Created Industry: ${industry.nameZh} (${industry.code})`);

        // 2. Add Salary Config (2024 Rule)
        await prisma.industrySalaryConfig.create({
            data: {
                industryId: industry.id,
                effectiveDate: new Date('2024-01-01'),
                technicalSalary: 30590,
                nonTechnicalSalary: 30590,
                midLevelSalary: 33000
            }
        });
        console.log('Added Salary Config for 2024');

        // 3. Add Salary Config (2025 Rule - Simulated Increase)
        await prisma.industrySalaryConfig.create({
            data: {
                industryId: industry.id,
                effectiveDate: new Date('2025-01-01'),
                technicalSalary: 31000,
                nonTechnicalSalary: 31000,
                midLevelSalary: 35000
            }
        });
        console.log('Added Salary Config for 2025');

        // 4. Verify Query: Get Valid Salary for Today (2025-12-23)
        // Should get the 2025 rule
        const currentRule = await prisma.industrySalaryConfig.findFirst({
            where: {
                industryId: industry.id,
                effectiveDate: { lte: new Date() } // Effective date <= Today
            },
            orderBy: { effectiveDate: 'desc' } // Get the latest one
        });

        if (!currentRule || currentRule.technicalSalary !== 31000) {
            throw new Error(`Failed to retrieve correct salary for 2025. Got: ${currentRule?.technicalSalary}`);
        }
        console.log(`Verified Current Salary (2025): ${currentRule.technicalSalary}`);

        // 5. Verify Query: Get Valid Salary for Past Date (2024-06-01)
        const pastRule = await prisma.industrySalaryConfig.findFirst({
            where: {
                industryId: industry.id,
                effectiveDate: { lte: new Date('2024-06-01') }
            },
            orderBy: { effectiveDate: 'desc' }
        });

        if (!pastRule || pastRule.technicalSalary !== 30590) {
            throw new Error(`Failed to retrieve correct salary for 2024. Got: ${pastRule?.technicalSalary}`);
        }
        console.log(`Verified Past Salary (2024): ${pastRule.technicalSalary}`);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        if (industryId) {
            await prisma.industry.delete({ where: { id: industryId } }).catch(console.error);
        }
        await prisma.$disconnect();
    }
}

main();
