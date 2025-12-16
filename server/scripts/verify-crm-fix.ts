import * as dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/prisma';
import { convertLeadToEmployer } from '../src/services/crmService';

async function main() {
    console.log('Starting verification...');

    // 0. Create Internal User for FK
    const user = await prisma.internalUser.create({
        data: {
            username: 'tester',
            email: 'tester@example.com',
            passwordHash: 'hash',
            role: 'admin'
        }
    });

    // 1. Create a Test Lead
    const lead = await prisma.lead.create({
        data: {
            companyName: 'Test Corp ' + Date.now(),
            contactPerson: 'Tester',
            phone: '0912345678',
            status: 'NEW',
            industry: 'MANUFACTURING', // 01
            source: 'Website',
            assignedTo: user.id // Optional but good practice
        }
    });
    console.log(`Created Lead: ${lead.id}`);

    // 2. Convert to Employer with params
    const laborCount = 125;
    const allocationRate = 0.15;

    console.log(`Converting Lead with laborCount=${laborCount}, allocationRate=${allocationRate}...`);

    // Use valid user ID
    const employer = await convertLeadToEmployer(lead.id, user.id, {
        taxId: '12345678',
        industryCode: '01',
        invoiceAddress: 'Test Address 123',
        factoryAddress: 'Factory Address 456',
        avgDomesticWorkers: laborCount,
        allocationRate: allocationRate
    });

    console.log(`Created Employer: ${employer.id}`);

    // 3. Verify Employer Data
    console.log('Verifying Employer Data...');
    if (Number(employer.allocationRate) === allocationRate) {
        console.log('✅ Allocation Rate Matches');
    } else {
        console.error(`❌ Allocation Rate Mismatch: Expected ${allocationRate}, Got ${employer.allocationRate}`);
    }

    // 4. Verify Labor Count Data
    console.log('Verifying Labor Count Data...');
    const laborRecord = await prisma.employerLaborCount.findFirst({
        where: { employerId: employer.id }
    });

    if (laborRecord && laborRecord.count === laborCount) {
        console.log('✅ Labor Count Record Created & Matches');
    } else {
        console.error(`❌ Labor Count Failure: Record ${laborRecord ? 'Exists' : 'Missing'}, Count: ${laborRecord?.count}`);
    }

    // Cleanup
    await prisma.employerLaborCount.deleteMany({ where: { employerId: employer.id } });
    await prisma.employer.delete({ where: { id: employer.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
    console.log('Cleanup complete.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
