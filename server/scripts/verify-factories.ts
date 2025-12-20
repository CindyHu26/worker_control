// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const code = 'TEST-EMP-UNIQUE-001';

    const emp = await prisma.employer.findUnique({
        where: { code },
        include: {
            factories: {
                orderBy: { name: 'asc' }
            },
            individualInfo: true,
        }
    });

    if (!emp) {
        console.log(`Employer with code ${code} not found.`);
        return;
    }

    const output = {
        id: emp.id,
        code: emp.code,
        name: emp.companyName,
        individualInfo: emp.individualInfo,
        factories: emp.factories
    };

    fs.writeFileSync(path.join(__dirname, 'verify_output.json'), JSON.stringify(output, null, 2));
    console.log('Output written to verify_output.json');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
