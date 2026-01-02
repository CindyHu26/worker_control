
import prisma from '../src/prisma';
import { jobOrderService } from '../src/services/jobOrderService';

async function main() {
    console.log('--- Starting JobOrder Logic Test ---');

    // 1. Setup Employer
    const employer = await prisma.employer.findFirst();
    if (!employer) {
        console.error('No employer found. Please seed data.');
        return;
    }
    console.log(`Using Employer: ${employer.companyName} (${employer.id})`);

    // 2. Create Job Order (Normal)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30); // Valid for 30 days

    console.log('Creating Job Order 1...');
    const jobOrder1 = await jobOrderService.createJobOrder({
        employerId: employer.id,
        recruitmentType: 'INITIAL',
        letterNumber: 'TEST-001',
        issueDate: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        quota: 2,
        countryCode: 'VNM',
        title: 'Test Order 1'
    });
    console.log('Job Order 1 Created:', jobOrder1.id);

    // 3. Validate Normal
    console.log('Testing Validation 1 (Normal)...');
    try {
        await jobOrderService.validateJobOrderQuota(jobOrder1.id, 'VNM');
        console.log('SUCCESS: Validation passed as expected.');
    } catch (e: any) {
        console.error('FAILURE: Unexpected validation error:', e.message);
    }

    // 4. Validate Country Mismatch
    console.log('Testing Validation 2 (Country Mismatch)...');
    try {
        await jobOrderService.validateJobOrderQuota(jobOrder1.id, 'IDN');
        console.error('FAILURE: Should have failed with country mismatch.');
    } catch (e: any) {
        if (e.message.includes('Country Mismatch')) {
            console.log('SUCCESS: Caught expected country mismatch error.');
        } else {
            console.error('FAILURE: Caught unexpected error:', e.message);
        }
    }

    // 5. Test Quota Limit
    console.log('Testing Validation 3 (Quota Limit)...');
    // Manually set usedQuota to 2
    await prisma.jobOrder.update({
        where: { id: jobOrder1.id },
        data: { usedQuota: 2 }
    });
    try {
        await jobOrderService.validateJobOrderQuota(jobOrder1.id, 'VNM');
        console.error('FAILURE: Should have failed with no quota.');
    } catch (e: any) {
        if (e.message.includes('No Quota Remaining')) {
            console.log('SUCCESS: Caught expected quota error.');
        } else {
            console.error('FAILURE: Caught unexpected error:', e.message);
        }
    }

    // 6. Test Expiry
    console.log('Testing Validation 4 (Expiry)...');
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    const jobOrder2 = await jobOrderService.createJobOrder({
        employerId: employer.id,
        recruitmentType: 'INITIAL',
        letterNumber: 'TEST-002',
        issueDate: new Date().toISOString(),
        validUntil: expiredDate.toISOString(),
        quota: 1,
        title: 'Expired Order'
    });
    try {
        await jobOrderService.validateJobOrderQuota(jobOrder2.id, 'VNM');
        console.error('FAILURE: Should have failed with expiry.');
    } catch (e: any) {
        if (e.message.includes('Expired')) {
            console.log('SUCCESS: Caught expected expiry error.');
        } else {
            console.error('FAILURE: Caught unexpected error:', e.message);
        }
    }

    // Cleanup
    await prisma.jobOrder.deleteMany({
        where: { id: { in: [jobOrder1.id, jobOrder2.id] } }
    });
    console.log('--- Test Completed ---');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
