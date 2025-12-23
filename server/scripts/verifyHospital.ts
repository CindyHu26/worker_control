import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Hospital verification...');

    const code = `H${Date.now().toString().slice(-6)}`;
    let hospitalId: string | undefined;

    try {
        // 1. Create Hospital with all new fields
        const hospital = await prisma.hospital.create({
            data: {
                code: `H_${code}`,
                name: `General Hospital ${code}`,
                shortName: `GenHos ${code}`,
                city: 'Taipei',
                address: '123 Health St, Taipei City',
                phone: '02-1234-5678',
                fax: '02-1234-5679',
                contactPerson: 'Dr. Smith',
                assessmentCode: `ASSESS_${code}`,
                sortOrder: 10,
                isGeneral: true,
            },
        });
        hospitalId = hospital.id;
        console.log('Created Hospital:', hospital.id);

        // 2. Retrieve and Verify
        const fetchedHospital = await prisma.hospital.findUnique({
            where: { id: hospital.id },
        });

        if (!fetchedHospital) throw new Error('Hospital not found');

        if (fetchedHospital.shortName !== `GenHos ${code}`) throw new Error('ShortName mismatch');
        if (fetchedHospital.address !== '123 Health St, Taipei City') throw new Error('Address mismatch');
        if (fetchedHospital.phone !== '02-1234-5678') throw new Error('Phone mismatch');
        if (fetchedHospital.fax !== '02-1234-5679') throw new Error('Fax mismatch');
        if (fetchedHospital.contactPerson !== 'Dr. Smith') throw new Error('ContactPerson mismatch');
        if (fetchedHospital.assessmentCode !== `ASSESS_${code}`) throw new Error('AssessmentCode mismatch');
        if (fetchedHospital.sortOrder !== 10) throw new Error('SortOrder mismatch');

        console.log('Verification Successful!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // 3. Cleanup
        if (hospitalId) {
            try {
                await prisma.hospital.delete({ where: { id: hospitalId } });
                console.log('Cleanup Successful');
            } catch (e) {
                console.error('Cleanup Failed:', e);
            }
        }
        await prisma.$disconnect();
    }
}

main();
