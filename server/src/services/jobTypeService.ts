import prisma from '../prisma';
import { Prisma } from '../generated/client';

export const getJobTypes = async (page: number = 1, pageSize: number = 20, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.JobTypeWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { titleZh: { contains: search, mode: 'insensitive' } },
                { titleEn: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await Promise.all([
        prisma.jobType.count({ where }),
        prisma.jobType.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { sortOrder: 'asc' },
        }),
    ]);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
};

export const getJobTypeById = async (id: string) => {
    return prisma.jobType.findUnique({
        where: { id },
    });
};

export const createJobType = async (data: Prisma.JobTypeCreateInput) => {
    return prisma.jobType.create({
        data,
    });
};

export const updateJobType = async (id: string, data: Prisma.JobTypeUpdateInput) => {
    return prisma.jobType.update({
        where: { id },
        data,
    });
};

export const deleteJobType = async (id: string) => {
    return prisma.jobType.delete({
        where: { id },
    });
};
