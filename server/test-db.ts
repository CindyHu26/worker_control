import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('Database connected successfully!');
        const workers = await prisma.worker.count();
        console.log(`Found ${workers} workers.`);
    } catch (e) {
        console.error('Failed to connect to database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
