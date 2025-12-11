```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // 1. Seed Admin User
    const adminEmail = 'admin@example.com';
    const adminUsername = 'admin';
    const defaultPasswordHash = await bcrypt.hash('change_me', 10);

    const admin = await prisma.internalUser.upsert({
        where: { username: adminUsername },
        update: {
            passwordHash: defaultPasswordHash // Update it if exists too, to fix legacy plain text
        },
        create: {
            username: adminUsername,
            email: adminEmail,
            passwordHash: defaultPasswordHash,
            role: 'admin'
        }
    });

    console.log({ admin });

    // 2. Seed Taiwan Major Cities (Example for Dropdown Data if stored in separate table, 
    // currently we don't have a Cities table but we can log that we are ready)
    console.log('Seeding initial data...');

    // Example: Default Nationality (If referenced dynamic) - currently Enum.

    // 3. System Settings (Mocking one if we had a settings table)
    console.log('System initialized.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
