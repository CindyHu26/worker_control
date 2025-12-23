import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting ContractEndReason verification...');

    const code = `CE${Date.now().toString().slice(-6)}`;
    let reasonId: string | undefined;
    let deploymentId: string | undefined;
    let workerId: string | undefined;
    let employerId: string | undefined;

    try {
        // 0. Setup Prerequisites (Worker, Employer)
        // 0. Setup Prerequisites (Worker, Employer)
        const nat = await prisma.nationality.findUnique({ where: { code: 'PH' } })
            || await prisma.nationality.create({ data: { code: 'PH', name: 'Philippines', nameZh: '菲律賓' } });

        const worker = await prisma.worker.create({
            data: {
                englishName: `Worker ${code}`,
                dob: new Date('1990-01-01'),
                nationalityId: nat.id,
            }
        });
        workerId = worker.id;

        const employer = await prisma.employer.create({
            data: {
                companyName: `Employer ${code}`,
            }
        });
        employerId = employer.id;


        // 1. Create ContractEndReasons
        const reasonNormal = await prisma.contractEndReason.create({
            data: {
                code: `HAA_${code}`,
                name: 'Term Expired',
                isAbnormal: false,
                category: 'Normal',
            },
        });
        reasonId = reasonNormal.id;
        console.log('Created Reason:', reasonNormal.name, reasonNormal.code);

        const reasonAbnormal = await prisma.contractEndReason.create({
            data: {
                code: `HEE_${code}`,
                name: 'Runaway',
                isAbnormal: true,
                category: 'Abnormal',
            },
        });
        console.log('Created Reason:', reasonAbnormal.name, reasonAbnormal.code);

        // 2. Create Deployment linked to Reason
        const deployment = await prisma.deployment.create({
            data: {
                workerId: worker.id,
                employerId: employer.id,
                startDate: new Date(),
                status: 'ended', // Using the enum
                contractEndReasonId: reasonNormal.id,
            },
            include: {
                contractEndReason: true,
            }
        });
        deploymentId = deployment.id;

        console.log('Created Deployment linked to:', deployment.contractEndReason?.name);

        if (deployment.contractEndReason?.code !== `HAA_${code}`) {
            throw new Error('Verification failed: Linked reason code mismatch');
        }

        console.log('Verification Successful!');

    } catch (error) {
        console.error('Verification Failed:', error);
        process.exit(1);
    } finally {
        // 3. Cleanup
        if (deploymentId) await prisma.deployment.delete({ where: { id: deploymentId } }).catch(console.error);
        if (reasonId) await prisma.contractEndReason.delete({ where: { id: reasonId } }).catch(console.error);
        // Cleanup worker/employer acts as cascade usually, but manual delete to be safe/clean
        if (workerId) await prisma.worker.delete({ where: { id: workerId } }).catch(console.error);
        if (employerId) await prisma.employer.delete({ where: { id: employerId } }).catch(console.error);

        await prisma.$disconnect();
    }
}

main();
