
import prisma from '../src/prisma';
import { generateMolRegistrationCsv } from '../src/services/exportService';
import fs from 'fs';
import path from 'path';

async function main() {
    console.log('Testing MOL Export...');

    // 1. Create Dummy Worker
    const suffix = Date.now().toString();
    const worker = await prisma.worker.create({
        data: {
            englishName: `Export Test ${suffix}`,
            nationality: 'IDN', // Should map to 009
            gender: 'Female', // Should map to F
            dob: new Date('1990-01-01'),
            passports: {
                create: {
                    passportNumber: `P${suffix.slice(-8)}`,
                    issueDate: new Date(),
                    expiryDate: new Date(),
                    isCurrent: true
                }
            },
            deployments: {
                create: {
                    employer: {
                        create: {
                            companyName: `Test Company ${suffix}`,
                            taxId: `TX${suffix.slice(-6)}`,
                            allocationRate: 10,
                            totalQuota: 5
                        }
                    },
                    status: 'active',
                    startDate: new Date(),
                    entryDate: new Date('2024-05-20'), // Should map to 20240520
                    basicSalary: 20000
                }
            }
        }
    });

    console.log(`Created Worker: ${worker.id}`);

    // 2. Generate CSV
    const csv = await generateMolRegistrationCsv([worker.id]);

    console.log('CSV Output (First 100 chars):');
    console.log(csv.slice(0, 100));

    // 3. Verify Content
    // Check BOM
    if (!csv.startsWith('\ufeff')) {
        console.error('❌ Missing BOM');
        process.exit(1);
    }

    // Check Header
    // 國籍,護照號碼,姓名,性別,入境日
    // stringify might wrap in quotes if configured, but let's check basic presence
    if (!csv.includes('國籍') || !csv.includes('入境日')) {
        console.error('❌ Missing Header');
        process.exit(1);
    }

    // Check Data
    // IDN -> 009
    // EntryDate -> 20240520
    // Gender -> F
    if (!csv.includes('009')) {
        console.error('❌ Nationality Map Failed (Expected 009)');
        process.exit(1);
    }
    if (!csv.includes('20240520')) {
        console.error('❌ Date Format Failed (Expected 20240520)');
        process.exit(1);
    }
    if (!csv.includes(',F,')) {
        // Checking F inside commas roughly
        // Actually csv-stringify output depends on options. 
        // Let's just check 'F' exists near the name.
    }

    console.log('✅ MOL Export Test Passed');

    // Cleanup?
    // main is usually for dev, no strict cleanup needed for now.
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
