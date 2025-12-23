import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting OfficialDocument verification...');

    // Create unique suffix
    const suffix = Date.now().toString().slice(-6);

    let employerId: string | undefined;
    let workerId: string | undefined;

    try {
        // 1. Create Employer
        const employer = await prisma.employer.create({
            data: {
                code: `EMP_${suffix}`,
                companyName: `Test Company ${suffix}`,

            }
        });
        employerId = employer.id;
        console.log(`Created Employer: ${employer.companyName}`);

        // 2. Create Worker
        const worker = await prisma.worker.create({
            data: {
                englishName: `Worker ${suffix}`,
                dob: new Date('1990-01-01')
            }
        });
        workerId = worker.id;
        console.log(`Created Worker: ${worker.englishName}`);

        // 3. Create Official Document (Runaway Letter) linked to both
        const docDate = new Date('2023-12-25'); // Gregorian
        const doc = await prisma.officialDocument.create({
            data: {
                employerId: employer.id,
                workerId: worker.id,
                documentType: 'RUNAWAY',
                docNumber: `MOL-123-${suffix}`,
                issueDate: docDate,
                issuingAgency: 'Ministry of Labor',
                title: 'Runaway Notification'
            }
        });
        console.log(`Created OfficialDocument: ${doc.docNumber}`);

        // 4. Verify Fetch
        const fetchedDoc = await prisma.officialDocument.findUnique({
            where: { id: doc.id },
            include: { employer: true, worker: true }
        });

        if (!fetchedDoc) throw new Error('Failed to fetch document');
        if (fetchedDoc.documentType !== 'RUNAWAY') throw new Error('Incorrect document type');
        if (fetchedDoc.issueDate.toISOString().split('T')[0] !== '2023-12-25') {
            throw new Error(`Date mismatch. Expected 2023-12-25, got ${fetchedDoc.issueDate.toISOString()}`);
        }
        if (fetchedDoc.worker?.id !== worker.id) throw new Error('Worker linkage failed');

        console.log('Verification Passed: Document created and linked correctly.');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (workerId) await prisma.worker.delete({ where: { id: workerId } }).catch(console.error);
        if (employerId) await prisma.employer.delete({ where: { id: employerId } }).catch(console.error);
        await prisma.$disconnect();
    }
}

main();
