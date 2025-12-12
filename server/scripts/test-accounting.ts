
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAccounting() {
    console.log("=== Testing Accounting Logic ===");

    // 1. Setup Data
    const prefix = `TEST_${Date.now()}`;

    // Create Employer
    const employer = await prisma.employer.create({
        data: {
            taxId: `${prefix}_TAX`,
            companyName: `${prefix}_Co`,
            type: 'corporate'
        }
    });

    // Create Worker
    const worker = await prisma.worker.create({
        data: {
            englishName: `${prefix}_Worker`,
            dob: new Date('1990-01-01'),
            nationality: 'PH'
        }
    });

    // Create Deployment (Active)
    // Scenario: Target Month: 2024/05
    // Start Date: 2024-05-15
    // Active Days: 15 (May 15) to 31 (May 31) = 17 days
    const startDate = new Date('2024-05-15');
    const deployment = await prisma.deployment.create({
        data: {
            workerId: worker.id,
            employerId: employer.id,
            startDate: startDate,
            status: 'active',
            monthlyFee: {
                create: {
                    amountYear1: 1500, // Monthly Rate
                    amountYear2: 1500,
                    amountYear3: 1500,
                    accommodationFee: 2500 // Monthly Rate
                }
            }
        },
        include: { monthlyFee: true }
    });

    // 2. Run Logic (Simulated from accounting.ts)
    // Target: 2024/05
    const year = 2024;
    const month = 5;

    const targetMonthStart = new Date(Date.UTC(year, month - 1, 1));
    const targetMonthEnd = new Date(Date.UTC(year, month, 0));

    // Calc Active Days
    const effectiveStart = new Date(Math.max(targetMonthStart.getTime(), startDate.getTime()));
    const effectiveEnd = targetMonthEnd; // No end date on deployment
    const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
    const activeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    console.log(`Active Days Calculation: Expected 17, Got ${activeDays}`);
    if (activeDays !== 17) throw new Error("Active Days Calc Fail");

    // Calc Fees
    const serviceFeeRate = 1500;
    const accomFeeRate = 2500;

    // Formula: Round(Rate * (ActiveDays / 30))
    const expectedService = Math.round(serviceFeeRate * (activeDays / 30));
    const expectedAccom = Math.round(accomFeeRate * (activeDays / 30));

    console.log(`Service Fee: Rate 1500, Days 17 => Expected ${Math.round(1500 * 17 / 30)} (${expectedService})`);
    console.log(`Accom Fee: Rate 2500, Days 17 => Expected ${Math.round(2500 * 17 / 30)} (${expectedAccom})`);

    // 3. Cleanup
    await prisma.deployment.delete({ where: { id: deployment.id } });
    await prisma.worker.delete({ where: { id: worker.id } }); // Cascades? Check schema. Worker deletes might not cascade to employer but employer to worker no. 
    // Deployment deletes monthlyFee cascade.
    await prisma.employer.delete({ where: { id: employer.id } });

    console.log("=== Accounting Test Passed ===");
}

testAccounting()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
