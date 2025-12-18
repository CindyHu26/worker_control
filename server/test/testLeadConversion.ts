
import { PrismaClient } from '@prisma/client';
import { convertLeadToEmployer } from '../src/services/crmService';

const prisma = new PrismaClient();

async function testLeadConversion() {
    console.log('Testing Lead Conversion Refactor...');
    const TEST_TAX_ID = '99887766';

    try {
        // 1. Cleanup
        await prisma.lead.deleteMany({ where: { taxId: TEST_TAX_ID } });
        await prisma.employer.deleteMany({ where: { taxId: TEST_TAX_ID } });
        // Ensure mock user exists or create one
        let operator = await prisma.systemAccount.findFirst({ where: { username: 'test-admin' } });
        if (!operator) {
            operator = await prisma.systemAccount.create({
                data: {
                    username: 'test-admin',
                    email: 'test@example.com',
                    passwordHash: 'hash'
                    // check your schema for required fields on SystemAccount
                }
            });
        }
        const OPERATOR_ID = operator.id;

        // 2. Create Lead
        console.log('Creating Lead...');
        const lead = await prisma.lead.create({
            data: {
                companyName: 'Test Conversion Co',
                taxId: TEST_TAX_ID,
                contactPerson: 'Mr. Test',
                phone: '0912345678',
                status: 'NEW',
                industry: 'MANUFACTURING',
                createdBy: OPERATOR_ID
            }
        });
        console.log('Lead Created:', lead.id);

        // 3. Convert to Employer (Manufacturing)
        console.log('Converting to Employer...');
        const employer = await convertLeadToEmployer(lead.id, OPERATOR_ID, {
            taxId: TEST_TAX_ID,
            industryType: 'MANUFACTURING',
            industryCode: '01',
            factoryAddress: '123 Factory Rd',
            avgDomesticWorkers: 10,
            allocationRate: 0.20
        });
        console.log('Employer Created:', employer.id);

        // 4. Verify Relations
        const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
        const updatedEmployer = await prisma.employer.findUnique({ where: { id: employer.id } });

        if (updatedLead?.convertedEmployerId === employer.id) {
            console.log('PASS: Lead -> Employer Link OK');
        } else {
            console.error('FAIL: Lead -> Employer Link Missing', updatedLead);
        }

        if (updatedEmployer?.originLeadId === lead.id) {
            console.log('PASS: Employer -> Lead Link OK');
        } else {
            console.error('FAIL: Employer -> Lead Link Missing', updatedEmployer);
        }

        // 5. Test Duplicate Employer Check logic (Simulation)
        // We can't easily call the API route here without supertest, but we can verify the DB state
        // The API route just checks `prisma.employer.findUnique({ where: { taxId } })`
        const duplicateCheck = await prisma.employer.findUnique({ where: { taxId: TEST_TAX_ID } });
        if (duplicateCheck) {
            console.log('PASS: Employer exists for Duplicate Check');
        }

        // 6. Test Non-Manufacturing Validation (Optional)
        // ...

        console.log('Test Complete.');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        // Cleanup
        await prisma.lead.deleteMany({ where: { taxId: TEST_TAX_ID } });
        await prisma.employer.deleteMany({ where: { taxId: TEST_TAX_ID } }); // Cascade might handle it if set, but explicit is safer
        await prisma.$disconnect();
    }
}

testLeadConversion();
