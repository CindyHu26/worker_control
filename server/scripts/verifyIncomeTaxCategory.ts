import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting IncomeTaxCategory verification...');

    const suffix = Date.now().toString().slice(-6);
    let categoryId: string | undefined;

    try {
        // 1. Create a Category (e.g., 50 for Salary)
        const category = await prisma.incomeTaxCategory.create({
            data: {
                code: `50_${suffix}`,
                name: '薪資所得',
                nameEn: 'Salary Income',
                taxRateNonResident: 18.00, // 18%
            }
        });
        categoryId = category.id;
        console.log(`Created Category: Code=${category.code}, Name=${category.name}, Rate=${category.taxRateNonResident}`);

        // 2. Verified Read
        const found = await prisma.incomeTaxCategory.findUnique({
            where: { code: `50_${suffix}` }
        });

        if (!found || found.taxRateNonResident.toNumber() !== 18) {
            throw new Error(`Read verification failed for ${category.code}`);
        }
        console.log('Read verification successful');

        // 3. Update (Regulation change: 18% -> 20%)
        const updated = await prisma.incomeTaxCategory.update({
            where: { id: categoryId },
            data: { taxRateNonResident: 20.00 }
        });
        console.log(`Updated Rate to: ${updated.taxRateNonResident}`);

        if (updated.taxRateNonResident.toNumber() !== 20) {
            throw new Error('Update verification failed');
        }

        // 4. Soft Delete (not physically deleting, just setting inactive if we wanted, but here we physically delete for cleanup)
        console.log('Validation passed.');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        if (categoryId) {
            await prisma.incomeTaxCategory.delete({ where: { id: categoryId } }).catch(console.error);
        }
        await prisma.$disconnect();
    }
}

main();
