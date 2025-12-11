import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Resetting Database...');

    // 1. Force Push (Schema Reset)
    try {
        console.log('   Running prisma db push --force-reset...');
        execSync('npx prisma db push --force-reset --accept-data-loss', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ DB Push failed.', e);
        process.exit(1);
    }

    // 2. Apply Custom Triggers
    console.log('⚡ Applying SQL Triggers...');
    const triggersPath = path.join(__dirname, 'triggers.sql');
    if (fs.existsSync(triggersPath)) {
        const sqlContent = fs.readFileSync(triggersPath, 'utf-8');
        const sections = sqlContent.split('-- SECTION --');

        for (const section of sections) {
            if (section.trim()) {
                try {
                    await prisma.$executeRawUnsafe(section);
                } catch (e) {
                    console.error('❌ Failed to execute SQL section:', e);
                    // console.error(section);
                }
            }
        }
    } else {
        console.warn('⚠️ triggers.sql not found.');
    }

    // 3. Seed Data
    console.log('🌱 Seeding Data...');
    try {
        // We run the seed script as a child process to avoid module caching or context issues
        execSync('npx ts-node prisma/seed.ts', { stdio: 'inherit' });
    } catch (e) {
        console.error('❌ Seeding failed.', e);
        process.exit(1);
    }

    console.log('✅ Database Reset & Initialized Successfully!');
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
