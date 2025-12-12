
import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const admin = await prisma.internalUser.findUnique({
            where: { username: 'admin' }
        });
        console.log('Admin user found:', !!admin);
        if (admin) console.log('Admin Role:', admin.role);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
