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
                        where: { ...args.where, isDeleted: false }
                    });
                }
                return query(args);
            },
        },
    },
});

export default prisma;
