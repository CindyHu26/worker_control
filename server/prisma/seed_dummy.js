
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Seeding dummy data...');

        // 1. Create Employer
        const employer = await prisma.employer.create({
            data: {
                companyName: 'Tech Corp',
                taxId: '99887766',
                responsiblePerson: 'Alice',
                // phone: '0912345678' // Check if phone exists
            }
        });
        console.log('Employer created:', employer.companyName);

        // 2. Create Worker
        const worker = await prisma.worker.create({
            data: {
                englishName: 'John Doe',
                chineseName: '約翰',
                nationality: 'Indonesia',
                gender: 'Male',
                dob: new Date('1995-05-20'),
                mobilePhone: '0900123456',
                passports: {
                    create: {
                        passportNumber: 'A11223344',
                        issueDate: new Date(),
                        expiryDate: new Date('2030-01-01'),
                        isCurrent: true
                    }
                }
            }
        });
        console.log('Worker created:', worker.englishName);

        // 3. Create Deployment (Recruitment Stage)
        await prisma.deployment.create({
            data: {
                workerId: worker.id,
                employerId: employer.id,
                startDate: new Date(),
                status: 'active',
                processStage: 'recruitment',
                serviceStatus: 'active_service'
            }
        });
        console.log('Deployment created');

        // 4. Create Another Worker (For Batch Test)
        const worker2 = await prisma.worker.create({
            data: {
                englishName: 'Jane Smith',
                nationality: 'Vietnam',
                gender: 'Female',
                dob: new Date('1998-08-15'),
                mobilePhone: '0900654321',
                passports: {
                    create: {
                        passportNumber: 'V99887766',
                        issueDate: new Date(),
                        expiryDate: new Date('2029-12-31'),
                        isCurrent: true
                    }
                }
            }
        });

        await prisma.deployment.create({
            data: {
                workerId: worker2.id,
                employerId: employer.id,
                startDate: new Date(),
                status: 'active',
                processStage: 'visa_processing',
                serviceStatus: 'active_service'
            }
        });
        console.log('Worker 2 created');

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
