
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyImmigration() {
    console.log('Verifying Immigration Logic...');

    try {
        // 1. Setup Data
        console.log('Creating Test Worker...');
        const worker = await prisma.worker.create({
            data: {
                englishName: 'Test Worker Immigration',
                dob: new Date('1990-01-01'),
                nationality: 'INDONESIA',
                status: 'CANDIDATE'
            }
        });

        // 2. Fetch Overseas Hospital
        const hospital = await prisma.hospital.findFirst({
            where: { isOverseas: true }
        });

        if (!hospital) {
            throw new Error('No overseas hospital found! Did you seed?');
        }

        // 3. Create Immigration Process (Simulate PUT)
        console.log('Creating Immigration Process...');
        const process = await prisma.immigrationProcess.create({
            data: {
                workerId: worker.id,
                healthCheckHospitalId: hospital.id,
                healthCheckDate: new Date(),
                healthCheckStatus: 'PASS',
                policeCode: 'POLICE-123',
                passportNo: 'PASSPORT-ABC'
            }
        });

        console.log('Process Created:', process.id);

        // 4. Verify Data Retrieval
        const fetched = await prisma.immigrationProcess.findUnique({
            where: { workerId: worker.id },
            include: { healthCheckHospital: true }
        });

        if (fetched?.healthCheckHospital?.id === hospital.id) {
            console.log('PASS: Health Check Hospital Linked Correctly');
        } else {
            console.error('FAIL: Hospital Link Broken', fetched);
        }

        if (fetched?.policeCode === 'POLICE-123') {
            console.log('PASS: Police Code Saved');
        }

        // 5. Cleanup
        await prisma.worker.delete({ where: { id: worker.id } }); // Cascade delete process
        console.log('Cleanup Done.');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

verifyImmigration();
