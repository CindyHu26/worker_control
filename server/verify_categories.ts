
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const codes = ['MANUFACTURING', 'HOME_CARE', 'INSTITUTION'];
    const categories = await prisma.employerCategory.findMany({
        where: { code: { in: codes } }
    });
    console.log(JSON.stringify(categories, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
