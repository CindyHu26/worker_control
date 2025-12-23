import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting JobType verification...');

  const code = `TEST_${Date.now()}`;

  // 1. Create
  const jobType = await prisma.jobType.create({
    data: {
      code: code,
      titleZh: '測試工種',
      titleEn: 'Test Job Type',
      titleTh: 'Test Thai',
      titleId: 'Test Indo',
      titleVn: 'Test VN',
      employmentSecurityFee: 2000,
      reentrySecurityFee: 1500,
      agencyAccidentInsurance: true,
      agencyAccidentInsuranceAmt: 300000,
      agencyLaborHealthInsurance: true,
      collectBankLoan: false,
      payDay: 10,
      requiresMedicalCheckup: true,
      sortOrder: 99,
      isActive: true,
    },
  });

  console.log('Created JobType:', jobType);

  // 2. Read
  const fetched = await prisma.jobType.findUnique({
    where: { code: code },
  });

  if (!fetched) {
    throw new Error('Failed to fetch created JobType');
  }

  // 3. Verify Fields
  if (fetched.titleZh !== '測試工種') throw new Error('titleZh mismatch');
  if (fetched.employmentSecurityFee !== 2000) throw new Error('Fee mismatch');
  if (fetched.agencyAccidentInsurance !== true) throw new Error('Insurance mismatch');

  console.log('Verification successful!');

  // 4. Cleanup
  await prisma.jobType.delete({
    where: { code: code },
  });
  console.log('Cleanup successful');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
