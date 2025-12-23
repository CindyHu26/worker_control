import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Nationality & Document verification...');

    const suffix = Date.now().toString().slice(-6);
    let nationalityId: string | undefined;
    let reqId: string | undefined;
    let templateId: string | undefined;
    let workerId: string | undefined;

    try {
        // 1. Create Nationality (e.g., PH)
        const nationality = await prisma.nationality.create({
            data: {
                code: `PH${suffix}`,
                name: 'Philippines',
                nameZh: '菲律賓',
                countryCode: 'PH',
            }
        });
        nationalityId = nationality.id;
        console.log('Created Nationality:', nationality.code);

        // 2. Create DocumentRequirement (e.g., Labor Contract)
        const requirement = await prisma.documentRequirement.create({
            data: {
                code: `CONTRACT_${suffix}`,
                name: 'Labor Contract',
                category: 'Entry',
                isRequired: true,
            }
        });
        reqId = requirement.id;
        console.log('Created Requirement:', requirement.name);

        // 3. Create Template linked to PH
        const template = await prisma.documentTemplate.create({
            data: {
                name: 'Labor Contract (English/Tagalog)',
                filePath: '/docs/contract_ph.pdf',
                documentRequirementId: requirement.id,
                nationalityId: nationality.id,
                language: 'en-PH',
                version: 'v1.0',
            }
        });
        templateId = template.id;
        console.log('Created Template linked to PH');

        // 4. Create Worker linked to Nationality
        const worker = await prisma.worker.create({
            data: {
                englishName: `Worker ${suffix}`,
                dob: new Date('1995-01-01'),
                nationalityId: nationality.id, // Using new relation
            },
            include: {
                nationality: true
            }
        });
        workerId = worker.id;
        console.log('Created Worker linked to:', worker.nationality?.name);

        // 5. Verify Logic: Find template for this worker
        const foundTemplate = await prisma.documentTemplate.findFirst({
            where: {
                documentRequirementId: requirement.id,
                nationalityId: worker.nationalityId
            }
        });

        if (!foundTemplate) {
            throw new Error('Failed to find specific template for worker nationality');
        }
        console.log('Successfully found template for worker:', foundTemplate.name);

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        if (workerId) await prisma.worker.delete({ where: { id: workerId } }).catch(console.error);
        if (templateId) await prisma.documentTemplate.delete({ where: { id: templateId } }).catch(console.error);
        if (reqId) await prisma.documentRequirement.delete({ where: { id: reqId } }).catch(console.error);
        if (nationalityId) await prisma.nationality.delete({ where: { id: nationalityId } }).catch(console.error);

        await prisma.$disconnect();
    }
}

main();
