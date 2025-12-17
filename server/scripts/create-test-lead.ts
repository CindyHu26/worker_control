import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestLead() {
    try {
        const lead = await prisma.lead.create({
            data: {
                companyName: '測試轉換公司 ' + Date.now(),
                contactPerson: '王經理',
                phone: '02-12345678',
                mobile: '0912345678',
                email: 'test@example.com',
                address: '台北市信義區測試路123號',
                source: 'Website',
                industry: '01 製造業',
                estimatedWorkerCount: 50,
                status: 'NEGOTIATING'
            }
        });

        console.log('CREATED_LEAD_ID:', lead.id);
        console.log('LEAD_URL: http://localhost:3000/crm/leads/' + lead.id);

        return lead;
    } catch (error) {
        console.error('Error creating lead:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createTestLead();
