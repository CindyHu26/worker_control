
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load env from server directory
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const prisma = new PrismaClient();

async function cleanup() {
    console.log('Starting manual cleanup...');
    const targetName = '宏華精密工業';

    try {
        // 1. Delete Employer
        const employers = await prisma.employer.findMany({
            where: { companyName: targetName }
        });

        for (const emp of employers) {
            console.log(`Deleting Employer: ${emp.companyName} (${emp.id})`);
            // Add deletions for related tables if necessary here
            await prisma.employer.delete({ where: { id: emp.id } });
        }

        // 2. Delete Lead
        const deletedLeads = await prisma.lead.deleteMany({
            where: { companyName: targetName }
        });
        console.log(`Deleted ${deletedLeads.count} Leads.`);

        console.log('Cleanup complete.');
    } catch (e) {
        console.error('Cleanup error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
