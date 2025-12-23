import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Recruitment Letter verification...');

    const suffix = Date.now().toString().slice(-6);
    let employerId: string | undefined;
    let industryId: string | undefined;
    let factoryId: string | undefined;

    try {
        // 1. Create Employer
        const employer = await prisma.employer.create({
            data: {
                code: `EMP_R_${suffix}`,
                companyName: `Recruit Test Co ${suffix}`,
            }
        });
        employerId = employer.id;
        console.log(`Created Employer: ${employer.companyName}`);

        // 2. Create Industry
        const industry = await prisma.industry.create({
            data: {
                code: `IND_${suffix}`,
                nameZh: 'Test Industry',
                category: 'A'
            }
        });
        industryId = industry.id;
        console.log(`Created Industry: ${industry.code}`);

        // 3. Create Factory
        const factory = await prisma.employerFactory.create({
            data: {
                employerId: employer.id,
                name: 'Factory 1',
                address: '123 Factory Rd'
            }
        });
        factoryId = factory.id;
        console.log(`Created Factory: ${factory.name}`);

        // 4. Create Recruitment Letter
        const letter = await prisma.employerRecruitmentLetter.create({
            data: {
                employerId: employer.id,
                letterNumber: `LET-${suffix}`,
                issueDate: new Date('2023-01-01'),
                expiryDate: new Date('2024-01-01'),

                // New Fields
                recruitmentProjectType: 'Five-Level 3K',
                applyForRehiringBonus: true,
                industryId: industry.id,
                workAddressType: 'FACTORY',
                workAddressFactoryId: factory.id,
                workAddress: '123 Factory Rd' // Manual text, usually auto-filled from factory
            }
        });
        console.log(`Created Letter: ${letter.letterNumber}`);

        // 5. Verify
        const fetchedLetter = await prisma.employerRecruitmentLetter.findUnique({
            where: { id: letter.id },
            include: {
                industry: true,
                workAddressFactory: true
            }
        });

        if (!fetchedLetter) throw new Error('Letter not found');
        if (fetchedLetter.recruitmentProjectType !== 'Five-Level 3K') throw new Error('Project type mismatch');
        if (fetchedLetter.applyForRehiringBonus !== true) throw new Error('Rehiring bonus mismatch');
        if (fetchedLetter.industry?.id !== industry.id) throw new Error('Industry link failed');
        if (fetchedLetter.workAddressFactory?.id !== factory.id) throw new Error('Factory link failed');

        console.log('Verification Passed!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (employerId) await prisma.employer.delete({ where: { id: employerId } }).catch(console.error); // Cascade deletes factory & letter
        if (industryId) await prisma.industry.delete({ where: { id: industryId } }).catch(console.error);
        await prisma.$disconnect();
    }
}

main();
