
import prisma from '../src/prisma';
import { buildWorkerDocumentContext, buildBatchDocumentContext } from '../src/utils/documentContext';

async function main() {
    console.log('Starting Document Context Verification...');

    // 1. Setup Test Data
    const uniqueSuffix = Date.now().toString();

    // Employer
    const employer = await prisma.employer.create({
        data: {
            companyName: `Test Company ${uniqueSuffix}`,
            taxId: `TAX${uniqueSuffix}`,
            allocationRate: 20,
            totalQuota: 5,
            laborCounts: {
                create: [
                    { year: 2024, month: 1, count: 10 },
                    { year: 2024, month: 2, count: 12 },
                    { year: 2024, month: 3, count: 14 } // Avg should be 12
                ]
            }
        }
    });

    // Recruitment Letter (M343 Recruit)
    const letter = await prisma.recruitmentLetter.create({
        data: {
            employerId: employer.id,
            letterNumber: `REC${uniqueSuffix}`,
            issueDate: new Date(),
            expiryDate: new Date(),
            approvedQuota: 10,
            reviewFeeReceiptNo: 'REC-123456',
            reviewFeeAmount: 500,
            reviewFeeDate: new Date('2024-01-01')
        }
    });

    // Entry Permit
    const permit = await prisma.entryPermit.create({
        data: {
            recruitmentLetterId: letter.id,
            permitNumber: `PERMIT${uniqueSuffix}`,
            issueDate: new Date(),
            expiryDate: new Date(),
            quota: 2
        }
    });

    // Dormitory (Living Care Plan)
    const dormitory = await prisma.dormitory.create({
        data: {
            name: `Test Dorm ${uniqueSuffix}`,
            address: '123 Dorm St.',
            totalArea: 100, // 100 sq meters
            capacity: 10,
            bathroomCount: 3,
            waterHeaterCount: 3,
            hasFireExtinguisher: true,
            hasFireAlarm: true,
            accommodationType: 'Factory Dorm',
            rooms: {
                create: [
                    { roomNumber: '101', capacity: 4 },
                    { roomNumber: '102', capacity: 6 }
                ]
            }
        }
    });

    // Worker 1 (Recruitment Link)
    const worker1 = await prisma.worker.create({
        data: {
            englishName: `Worker One ${uniqueSuffix}`,
            nationality: 'VN',
            dob: new Date('1990-01-01'),
            dormitoryId: dormitory.id,
            // Deployment linked to Permit -> Recruitment Letter
            deployments: {
                create: {
                    employerId: employer.id,
                    entryPermitId: permit.id,
                    startDate: new Date(),
                    status: 'active',
                    visaNumber: 'VISA-8888',
                    foodStatus: 'provided_free',
                    foodAmount: 0
                }
            }
        }
    });

    // Worker 2 (Employment Permit Link - Hiring)
    // We simulate "Employment Permit" context by adding specific fields in Deployment
    const worker2 = await prisma.worker.create({
        data: {
            englishName: `Worker Two ${uniqueSuffix}`,
            nationality: 'ID',
            dob: new Date('1995-05-05'),
            dormitoryId: dormitory.id,
            deployments: {
                create: {
                    employerId: employer.id,
                    startDate: new Date(),
                    status: 'active',
                    employmentPermitReceiptNo: 'EMP-9999',
                    employmentPermitAmount: 200,
                    employmentPermitDate: new Date('2024-02-01')
                }
            }
        }
    });

    console.log(`Created Test Data: Employer=${employer.id}, Workers=${worker1.id}, ${worker2.id}`);

    // 2. Verify Single Context (Worker 1 - Recruit)
    const ctx1 = await buildWorkerDocumentContext(worker1.id);

    console.log('\nScanning Worker 1 Context (Recruit Logic):');
    console.log('Avg Labor Count:', ctx1.avg_labor_count, '(Expected: 12)');
    console.log('Is Recruit Permit:', ctx1.is_recruit_permit, '(Expected: true)');
    console.log('Review Receipt:', ctx1.receipt_no, '(Expected: REC-123456)');
    console.log('Visa Number:', ctx1.visa_no, '(Expected: VISA-8888)');
    console.log('Dorm Bathroom:', ctx1.bathroom_count, '(Expected: 3)');
    console.log('Dorm Check Fire:', ctx1.chk_fire_ext, '(Expected: ☑)');

    // 3. Verify Single Context (Worker 2 - Employ)
    const ctx2 = await buildWorkerDocumentContext(worker2.id);
    console.log('\nScanning Worker 2 Context (Employ Logic):');
    console.log('Is Employ Permit:', ctx2.is_employ_permit, '(Expected: true)');
    console.log('Review Receipt:', ctx2.receipt_no, '(Expected: EMP-9999)');

    // 4. Verify Batch Context
    const batchCtx = await buildBatchDocumentContext([worker1.id, worker2.id]);
    console.log('\nScanning Batch Context:');
    console.log('Total Workers:', batchCtx.total_workers, '(Expected: 2)');
    console.log('Workers Array Length:', batchCtx.workers ? batchCtx.workers.length : 0);
    console.log('Worker 1 Name in Batch:', batchCtx.workers?.[0]?.name);

    if (
        ctx1.avg_labor_count === 12 &&
        ctx1.is_recruit_permit === true &&
        ctx1.receipt_no === 'REC-123456' &&
        ctx1.visa_no === 'VISA-8888' &&
        ctx1.bathroom_count === 3 &&
        ctx2.is_employ_permit === true &&
        ctx2.receipt_no === 'EMP-9999' &&
        batchCtx.workers?.length === 2
    ) {
        console.log('\n✅ VERIFICATION SUCCESSFUL');
    } else {
        console.error('\n❌ VERIFICATION FAILED');
        process.exit(1);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
