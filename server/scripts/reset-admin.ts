import { PrismaClient } from '../src/generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        const passwordHash = await bcrypt.hash('change_me', 10);

        const admin = await prisma.internalUser.upsert({
            where: { username: 'admin' },
            update: {
                passwordHash,
                email: 'admin@example.com',
                role: 'admin'
            },
            create: {
                username: 'admin',
                email: 'admin@example.com',
                passwordHash,
                role: 'admin'
            }
        });

        console.log('✅ Admin user created/updated successfully:');
        console.log('   Username: admin');
        console.log('   Password: change_me');
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
    } catch (error) {
        console.error('❌ Error resetting admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
