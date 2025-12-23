import { PrismaClient, AddressType } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting WorkerProfile verification...');

    const code = `W${Date.now().toString().slice(-6)}`;

    let workerId: string | undefined;
    let employerId: string | undefined;

    try {
        // 1. Create Worker
        const worker = await prisma.worker.create({
            data: {
                englishName: `Worker ${code}`,
                nationality: 'VN',
                dob: new Date('1990-01-01'),
                gender: 'female',
            },
        });
        workerId = worker.id;
        console.log('Created Worker:', worker.id);

        // 2. Create Employer
        const employer = await prisma.employer.create({
            data: {
                companyName: `Emp ${code}`,
                code: `E${code}`,
            },
        });
        employerId = employer.id;
        console.log('Created Employer:', employer.id);

        // 3. Create Deployment with Handover Date
        const deployment = await prisma.deployment.create({
            data: {
                workerId: worker.id,
                employerId: employer.id,
                startDate: new Date(),
                handoverDate: new Date(Date.now() + 86400000), // Entry + 1 day
                entryDate: new Date(),
            },
        });
        console.log('Created Deployment with Handover:', deployment.handoverDate);

        // 4. Create Addresses (5 Types)
        const addressTypes: AddressType[] = [
            'approval_letter',
            'medical_pickup',
            'actual_residence',
            'arc',
            'work',
        ];

        for (const type of addressTypes) {
            await prisma.workerAddressHistory.create({
                data: {
                    workerId: worker.id,
                    addressType: type,
                    addressDetail: `Test Address for ${type}`,
                    startDate: new Date(),
                },
            });
        }
        console.log('Created 5 Address Types');

        // 5. Verify Logic
        const fetchedAddresses = await prisma.workerAddressHistory.findMany({
            where: { workerId: worker.id },
        });

        if (fetchedAddresses.length !== 5) throw new Error('Address count mismatch');

        const fetchedDeployment = await prisma.deployment.findUnique({
            where: { id: deployment.id },
        });

        if (!fetchedDeployment?.handoverDate) throw new Error('Handover Date missing');

        console.log('Verification Successful!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // 6. Cleanup
        if (workerId) {
            try {
                await prisma.worker.delete({ where: { id: workerId } });
                console.log('Deleted Worker');
            } catch (e) { console.error('Error deleting worker', e); }
        }
        if (employerId) {
            try {
                await prisma.employer.delete({ where: { id: employerId } });
                console.log('Deleted Employer');
            } catch (e) { console.error('Error deleting employer', e); }
        }
        await prisma.$disconnect();
    }
}

main();
