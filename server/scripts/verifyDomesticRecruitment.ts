
import { domesticRecruitmentService } from './src/services/domesticRecruitmentService';
import prisma from './src/prisma';

async function main() {
    console.log('Testing Domestic Recruitment Service...');

    // 1. Create Corporate
    const corporate = await prisma.employer.create({
        data: {
            companyName: 'Test Corp',
            taxId: 'TEST_' + Date.now(),
            corporateInfo: { create: { industryType: 'MANUFACTURING', capital: 100 } }
        }
    });

    // 2. Test Corporate Wait Period
    const res1 = await domesticRecruitmentService.validateWaitPeriod(corporate.id, new Date('2024-01-01'), new Date('2024-01-20')); // 19 days -> Fail
    console.log('Corporate < 21 days:', res1.valid === false ? 'PASS' : 'FAIL', res1);

    const res2 = await domesticRecruitmentService.validateWaitPeriod(corporate.id, new Date('2024-01-01'), new Date('2024-01-22')); // 21 days -> Pass
    console.log('Corporate >= 21 days:', res2.valid === true ? 'PASS' : 'FAIL');

    // 3. Create Individual
    const individual = await prisma.employer.create({
        data: {
            companyName: 'Test Indiv',
            individualInfo: { create: { idIssuePlace: 'TP' } }
        }
    });

    // 4. Test Individual Wait Period
    const res3 = await domesticRecruitmentService.validateWaitPeriod(individual.id, new Date('2024-01-01'), new Date('2024-01-05')); // 4 days -> Fail
    console.log('Individual < 7 days:', res3.valid === false ? 'PASS' : 'FAIL', res3);

    const res4 = await domesticRecruitmentService.validateWaitPeriod(individual.id, new Date('2024-01-01'), new Date('2024-01-08')); // 7 days -> Pass
    console.log('Individual >= 7 days:', res4.valid === true ? 'PASS' : 'FAIL');

    // Cleanup
    await prisma.employer.delete({ where: { id: corporate.id } });
    await prisma.employer.delete({ where: { id: individual.id } });
}

main().catch(console.error);
