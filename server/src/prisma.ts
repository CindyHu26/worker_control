import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

// Global Singleton Pattern to prevent multiple PrismaClient instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient;
}

console.log('LOADING src/prisma.ts with generated client (singleton)');

const SOFT_DELETE_MODELS = [
    'Employer',
    'Worker',
    'Deployment',
    'EmployerRecruitmentLetter',
    'JobOrder',
    'Lead'
];

const prisma = prismaClient.$extends({
    query: {
        $allModels: {
            async delete({ model, args, query }) {
                if (SOFT_DELETE_MODELS.includes(model)) {
                    return (prismaClient as any)[model].update({
                        ...args,
                        data: { isDeleted: true, deletedAt: new Date() },
                    });
                }
                return query(args);
            },
            async deleteMany({ model, args, query }) {
                if (SOFT_DELETE_MODELS.includes(model)) {
                    return (prismaClient as any)[model].updateMany({
                        ...args,
                        data: { isDeleted: true, deletedAt: new Date() },
                    });
                }
                return query(args);
            },
            async findMany({ model, args, query }) {
                if (SOFT_DELETE_MODELS.includes(model)) {
                    if ((args as any).where?.isDeleted === undefined) {
                        args.where = { ...args.where, isDeleted: false } as any;
                    }
                }
                return query(args);
            },
            async findFirst({ model, args, query }) {
                if (SOFT_DELETE_MODELS.includes(model)) {
                    if ((args as any).where?.isDeleted === undefined) {
                        args.where = { ...args.where, isDeleted: false } as any;
                    }
                }
                return query(args);
            },
            async findUnique({ model, args, query }) {
                if (SOFT_DELETE_MODELS.includes(model)) {
                    // Transform findUnique into findFirst to allow filtering by non-unique isDeleted
                    return (prismaClient as any)[model].findFirst({
                        ...args,
                        where: { ...args.where, isDeleted: false }
                    });
                }
                return query(args);
            },
        },
    },
    result: {
        employer: {
            // Computed full address (no zip)
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            // Formatted address (with zip)
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
            computedInvoiceAddress: {
                needs: { invoiceCity: true, invoiceDistrict: true, invoiceAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.invoiceCity && !data.invoiceDistrict && !data.invoiceAddressDetail) return null;
                    return `${data.invoiceCity || ''}${data.invoiceDistrict || ''}${data.invoiceAddressDetail || ''}`;
                },
            },
            computedTaxAddress: {
                needs: { taxCity: true, taxDistrict: true, taxAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.taxCity && !data.taxDistrict && !data.taxAddressDetail) return null;
                    return `${data.taxCity || ''}${data.taxDistrict || ''}${data.taxAddressDetail || ''}`;
                },
            },
            computedHealthBillAddress: {
                needs: { healthBillCity: true, healthBillDistrict: true, healthBillAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.healthBillCity && !data.healthBillDistrict && !data.healthBillAddressDetail) return null;
                    return `${data.healthBillCity || ''}${data.healthBillDistrict || ''}${data.healthBillAddressDetail || ''}`;
                },
            },
        },
        employerFactory: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
        },
        domesticAgency: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
        },
        bank: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
        },
        agencyCompany: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
        },
        // We also standardized Employee (though not in original plan, it's good practice)
        // Note: Employee in schema currently has `mailingAddressZh` etc removed and replaced with standard fields by mistake in Step 36?
        // Let's verify Step 36 output. Yes. So we should add Employee here too.
        employee: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
            computedMailingFullAddress: {
                needs: { mailingCity: true, mailingDistrict: true, mailingAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.mailingCity && !data.mailingDistrict && !data.mailingAddressDetail) return null;
                    return `${data.mailingCity || ''}${data.mailingDistrict || ''}${data.mailingAddressDetail || ''}`;
                },
            },
        },
        // Note: IndividualInfo is accessed via Employer typically, but if accessed directly:
        individualInfo: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
            computedCareAddress: {
                needs: { careCity: true, careDistrict: true, careAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.careCity && !data.careDistrict && !data.careAddressDetail) return null;
                    return `${data.careCity || ''}${data.careDistrict || ''}${data.careAddressDetail || ''}`;
                },
            },
        },
        corporateInfo: {
            computedFactoryAddress: {
                needs: { factoryCity: true, factoryDistrict: true, factoryAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.factoryCity && !data.factoryDistrict && !data.factoryAddressDetail) return null;
                    return `${data.factoryCity || ''}${data.factoryDistrict || ''}${data.factoryAddressDetail || ''}`;
                },
            },
        },
        employerRecruitmentLetter: {
            computedWorkAddress: {
                needs: { workAddressCity: true, workAddressDistrict: true, workAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.workAddressCity && !data.workAddressDistrict && !data.workAddressDetail) return null;
                    return `${data.workAddressCity || ''}${data.workAddressDistrict || ''}${data.workAddressDetail || ''}`;
                },
            },
        },
        worker: {
            computedForeignAddress: {
                needs: { foreignCity: true, foreignDistrict: true, foreignAddressDetail: true } as any,
                compute(data: any) {
                    if (!data.foreignCity && !data.foreignDistrict && !data.foreignAddressDetail) return null;
                    return `${data.foreignCity || ''}${data.foreignDistrict || ''}${data.foreignAddressDetail || ''}`;
                },
            },
        },
        workerAddressHistory: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
        },
        workerAccommodationHistory: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
        },
        dormitory: {
            computedFullAddress: {
                needs: { city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    if (!data.city && !data.district && !data.addressDetail) return null;
                    return `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                },
            },
            formattedAddress: {
                needs: { zipCode: true, city: true, district: true, addressDetail: true } as any,
                compute(data: any) {
                    const zip = data.zipCode ? `[${data.zipCode}] ` : '';
                    const body = `${data.city || ''}${data.district || ''}${data.addressDetail || ''}`;
                    return `${zip}${body}`;
                },
            },
        },
    },
});

export default prisma;
