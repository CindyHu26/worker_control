import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting ContractType verification...');

    const code = `CT${Date.now().toString().slice(-6)}`;
    let typeId: string | undefined;
    let deploymentId: string | undefined;
    let workerId: string | undefined;
    let employerId: string | undefined;

    try {
        // 1. Create ContractType
        const contractType = await prisma.contractType.create({
            data: {
                code: `CT_${code}`,
                name: `Test Type ${code}`,
                isControlled: true,
                sortOrder: 1,
            },
        });
        typeId = contractType.id;
        console.log('Created ContractType:', contractType.id);

        // 2. Create Requisites (Worker, Employer)
        const nat = await prisma.nationality.findUnique({ where: { code: 'VN' } })
            || await prisma.nationality.create({ data: { code: 'VN', name: 'Vietnam', nameZh: '越南' } });

        const worker = await prisma.worker.create({
            data: {
                englishName: `Worker ${code}`,
                nationalityId: nat.id,
                dob: new Date('1990-01-01'),
                gender: 'female',
            },
        });
        workerId = worker.id;

        const employer = await prisma.employer.create({
            data: {
                companyName: `Emp ${code}`,
                code: `E${code}`,
            },
        });
        employerId = employer.id;

        // 3. Create Deployment with ContractType
        const deployment = await prisma.deployment.create({
            data: {
                workerId: worker.id,
                employerId: employer.id,
                startDate: new Date(),
                contractTypeId: contractType.id,
            },
            include: {
                contractType: true,
            },
        });
        deploymentId = deployment.id;

        console.log('Created Deployment linked to:', deployment.contractType?.name);

        if (deployment.contractType?.code !== `CT_${code}`) {
            throw new Error('ContractType linkage failed');
        }

        console.log('Verification Successful!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // 4. Cleanup
        if (deploymentId) await prisma.deployment.delete({ where: { id: deploymentId } }).catch(console.error);
        if (workerId) await prisma.worker.delete({ where: { id: workerId } }).catch(console.error);
        if (employerId) await prisma.employer.delete({ where: { id: employerId } }).catch(console.error);
        if (typeId) await prisma.contractType.delete({ where: { id: typeId } }).catch(console.error);

        await prisma.$disconnect();
    }
}

main();
