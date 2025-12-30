
import { PrismaClient } from '@prisma/client';
import { createEmployer, deleteEmployer } from '../src/services/employerService';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const result: any = { success: false, logs: [], error: null };
    const log = (msg: string) => result.logs.push(msg);

    log('Verifying Employer Creation with Standardized Addresses...');

    const mockEmployerData = {
        companyName: 'Test Standardized Corp ' + Date.now(),
        taxId: '12345678',
        phoneNumber: '02-12345678',
        city: 'Taipei',
        district: 'Xinyi',
        addressDetail: 'Sec 5, Xinyi Rd',
        zipCode: '110',
        fullAddress: 'Taipei Xinyi Sec 5',
        invoiceCity: 'Taipei',
        invoiceDistrict: 'DaAn',
        invoiceAddressDetail: 'Invoice St.',
        invoiceZipCode: '106',
        taxCity: 'Taipei',
        taxDistrict: 'Songshan',
        taxAddressDetail: 'Tax St.',
        taxZipCode: '105',
        healthBillCity: 'New Taipei',
        healthBillDistrict: 'Banqiao',
        healthBillAddressDetail: 'Health St.',
        healthBillZipCode: '220',
        corporateInfo: {
            industryType: 'MANUFACTURING',
            factoryCity: 'Taoyuan',
            factoryDistrict: 'Zhongli',
            factoryAddressDetail: 'Factory Rd',
            factoryZipCode: '320'
        },
        factories: [
            {
                name: 'Factory 1',
                city: 'Kaohsiung',
                district: 'Sanmin',
                addressDetail: 'South Rd',
                zipCode: '807'
            }
        ]
    };

    try {
        const employer = await createEmployer(mockEmployerData);
        log(`✅ Employer created successfully: ${employer.id}`);

        const dbEmployer = await prisma.employer.findUnique({
            where: { id: employer.id },
            include: { corporateInfo: true, factories: true }
        });

        if (!dbEmployer) throw new Error('Employer not found in DB');

        log(`DB Invoice City: ${(dbEmployer as any).invoiceCity}`);
        log(`DB Corporate Factory City: ${(dbEmployer.corporateInfo as any)?.factoryCity}`);

        if ((dbEmployer as any).invoiceCity !== 'Taipei') throw new Error('Invoice City mismatch');
        if ((dbEmployer.corporateInfo as any)?.factoryCity !== 'Taoyuan') throw new Error('Corporate Factory City mismatch');
        if ((dbEmployer.factories[0] as any)?.factoryCity !== 'Kaohsiung') throw new Error('Factory City mismatch');

        log('Cleaning up...');
        await deleteEmployer(employer.id);
        result.success = true;
        log('✅ Verification Passed');

    } catch (error: any) {
        result.error = error.message + '\n' + error.stack;
        log('❌ Verification Failed: ' + error.message);
    } finally {
        fs.writeFileSync('verification_result.json', JSON.stringify(result, null, 2));
        await prisma.$disconnect();
        process.exit(result.success ? 0 : 1);
    }
}

main();
