import prisma from '../src/prisma';
import { createWorkerWithJobOrder } from '../src/services/workerService';

async function main() {
    console.log("🚀 Starting Verification Script: No Letter, No Worker Workflow");

    // Setup: Get or Create Reference Data
    let nationality = await prisma.nationality.findFirst();
    if (!nationality) {
        nationality = await prisma.nationality.create({
            data: { code: 'VN', nameZh: '越南', nameEn: 'Vietnam' }
        });
    }

    let category = await prisma.applicationCategory.findFirst();
    if (!category) {
        category = await prisma.applicationCategory.create({
            data: {
                code: 'MFG_TEST',
                nameZh: 'Test Manufacturing',
                type: 'BUSINESS',
                color: 'blue',
                iconName: 'Factory'
            }
        });
    }

    // 1. Create Test Employer
    console.log("\n[Step 1] Creating Employer: Verification Factory_NoQuota");
    const uniqueId = Date.now().toString();
    const employer = await prisma.employer.create({
        data: {
            companyName: `Verification Factory_NoQuota_${uniqueId}`,
            taxId: `TAX_${uniqueId.slice(-8)}`,
            applicationCategoryId: category.id,
            // Add other required fields if any (e.g. phone, address - often optional but let's check)
            phoneNumber: '0900000000',
        }
    });
    console.log(`✅ Employer Created: ${employer.id}`);

    // 2. Negative Test: Create Worker WITHOUT Job Order Quota
    console.log("\n[Step 2] Negative Test: Trying to create worker without Job Order...");
    try {
        await createWorkerWithJobOrder({
            employerId: employer.id,
            englishName: "Illegal Worker",
            dob: new Date('1990-01-01'),
            jobOrderId: null // Intentionally null
        });
        console.error("❌ FAILED: Should have thrown error for missing Job Order");
    } catch (e: any) {
        console.log(`✅ SUCCESS: System blocked worker creation. Error: ${e.message}`);
    }

    // 3. Create Valid Job Order
    console.log("\n[Step 3] Creating Job Order (Quota: 1)");
    const jobOrder = await prisma.jobOrder.create({
        data: {
            employerId: employer.id,
            quota: 1,
            usedQuota: 0,
            letterNumber: `TEST_LETTER_${uniqueId}`,
            recruitmentType: 'INITIAL',
            validUntil: new Date(Date.now() + 86400000 * 365) // 1 year
        }
    });
    console.log(`✅ Job Order Created: ${jobOrder.id} (Quota: 1)`);

    // 4. Positive Test: Create Worker with Valid Job Order
    console.log("\n[Step 4] Positive Test: Creating Worker with Job Order...");
    const worker1 = await createWorkerWithJobOrder({
        employerId: employer.id,
        jobOrderId: jobOrder.id,
        englishName: "Nguyen Test A",
        nationalityId: nationality.id,
        dob: new Date('1990-01-01'),
        mobilePhone: "0900000001",
        jobType: "FACTORY_WORKER"
    });
    console.log(`✅ SUCCESS: Worker Created: ${worker1.id}`);

    // 5. Verify Quota Deduction
    console.log("\n[Step 5] Verifying Job Order Quota Usage...");
    const updatedJob = await prisma.jobOrder.findUnique({ where: { id: jobOrder.id } });
    if (updatedJob?.usedQuota === 1) {
        console.log(`✅ SUCCESS: Used Quota is 1 / ${updatedJob.quota}`);
    } else {
        console.error(`❌ FAILED: Used Quota is ${updatedJob?.usedQuota} (Expected 1)`);
    }

    // 6. Negative Test: Exceed Quota
    console.log("\n[Step 6] Negative Test: Creating 2nd Worker (Should Fail due to Full Quota)...");
    try {
        await createWorkerWithJobOrder({
            employerId: employer.id,
            jobOrderId: jobOrder.id,
            englishName: "Nguyen Test B",
            nationalityId: nationality.id,
            dob: new Date('1990-01-01'),
            mobilePhone: "0900000002",
            jobType: "FACTORY_WORKER"
        });
        console.error("❌ FAILED: Should have blocked due to full quota");
    } catch (e: any) {
        console.log(`✅ SUCCESS: System blocked excessive worker. Error: ${e.message}`);
    }

    console.log("\n🎉 Verification Complete!");
}

main()
    .catch(e => {
        console.error("CRITICAL ERROR:");
        console.error(e.message);
        console.error(JSON.stringify(e, null, 2));
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
