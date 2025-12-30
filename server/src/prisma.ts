import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prismaClient = new PrismaClient();
console.log('LOADING src/prisma.ts with generated client');

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
        },
    },
});

export default prisma;
