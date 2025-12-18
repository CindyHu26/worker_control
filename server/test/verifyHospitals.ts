
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyHospitals() {
    console.log('Verifying Hospital Data...');

    const countGeneral = await prisma.hospital.count({ where: { isGeneral: true } });
    const countXray = await prisma.hospital.count({ where: { isXray: true } });

    console.log(`General Hospitals: ${countGeneral}`);
    console.log(`X-Ray Hospitals: ${countXray}`);

    if (countGeneral > 0 && countXray > 0) {
        console.log('PASSED: Data Present');
    } else {
        console.error('FAILED: No Data');
    }

    // Check one item
    const one = await prisma.hospital.findFirst({ where: { isGeneral: true } });
    if (one) {
        console.log('Sample Data:', one.name, one.validUntil);
    }

    await prisma.$disconnect();
}

verifyHospitals();
