import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting OfficialAgency verification...');

    const code = `OA${Date.now().toString().slice(-6)}`;
    let agencyId: string | undefined;

    try {
        // 1. Create Official Agency
        const agency = await prisma.officialAgency.create({
            data: {
                code: `OA_${code}`,
                name: `Ministry of Testing ${code}`,
                nameEn: `Ministry of Testing ${code}`,
                phone: '123-456-7890',
                isActive: true,
            },
        });
        agencyId = agency.id;
        console.log('Created Agency:', agency.name);

        // 2. Add Personnel
        const person = await prisma.officialAgencyPerson.create({
            data: {
                agencyId: agency.id,
                name: 'John Doe',
                title: 'Minister',
                titleEn: 'Minister',
                startDate: new Date(),
                isActing: false,
            },
        });
        console.log('Added Person:', person.name, person.title);

        // 3. Add Acting Personnel
        const actingPerson = await prisma.officialAgencyPerson.create({
            data: {
                agencyId: agency.id,
                name: 'Jane Smith',
                title: 'Deputy Minister',
                isActing: true,
                actingNotes: 'Acting while Minister is away',
            },
        });
        console.log('Added Acting Person:', actingPerson.name);

        // 4. Verify Retrieval
        const fetchedAgency = await prisma.officialAgency.findUnique({
            where: { id: agencyId },
            include: { personnel: true },
        });

        if (!fetchedAgency || fetchedAgency.personnel.length !== 2) {
            throw new Error('Verification failed: Personnel count mismatch');
        }

        console.log('Verification Successful!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // 5. Cleanup
        if (agencyId) await prisma.officialAgency.delete({ where: { id: agencyId } }).catch(console.error);
        await prisma.$disconnect();
    }
}

main();
