import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getApplicationCategories = async (page: number = 1, pageSize: number = 100, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.ApplicationCategoryWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await Promise.all([
        prisma.applicationCategory.count({ where }),
        prisma.applicationCategory.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { sortOrder: 'asc' },
            include: {
                workTitles: {
                    select: {
                        id: true,
                        code: true,
                        titleZh: true,
                        titleEn: true,
                        isDefault: true,
                        isIntermediate: true,
                    },
                    orderBy: { sortOrder: 'asc' },
                },
            },
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

export const getApplicationCategoryById = async (id: string) => {
    return prisma.applicationCategory.findUnique({
        where: { id },
        include: {
            workTitles: {
                orderBy: { sortOrder: 'asc' },
            },
        },
    });
};

export const getApplicationCategoryByCode = async (code: string) => {
    return prisma.applicationCategory.findUnique({
        where: { code },
        include: {
            workTitles: {
                orderBy: { sortOrder: 'asc' },
            },
        },
    });
};

export const createApplicationCategory = async (data: Prisma.ApplicationCategoryCreateInput) => {
    return prisma.applicationCategory.create({
        data,
    });
};

export const updateApplicationCategory = async (id: string, data: Prisma.ApplicationCategoryUpdateInput) => {
    return prisma.applicationCategory.update({
        where: { id },
        data,
    });
};

export const deleteApplicationCategory = async (id: string) => {
    return prisma.applicationCategory.delete({
        where: { id },
    });
};
