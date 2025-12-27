import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getWorkTitles = async (
    page: number = 1,
    pageSize: number = 100,
    search?: string,
    categoryId?: string
) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.WorkTitleWhereInput = {
        ...(search && {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { titleZh: { contains: search, mode: 'insensitive' } },
                { titleEn: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(categoryId && { categoryId }),
    };

    const [total, data] = await Promise.all([
        prisma.workTitle.count({ where }),
        prisma.workTitle.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { sortOrder: 'asc' },
            include: {
                category: {
                    select: {
                        id: true,
                        code: true,
                        nameZh: true,
                    },
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

export const getWorkTitleById = async (id: string) => {
    return prisma.workTitle.findUnique({
        where: { id },
        include: {
            category: true,
        },
    });
};

export const getDefaultWorkTitleForCategory = async (categoryId: string) => {
    return prisma.workTitle.findFirst({
        where: {
            categoryId,
            isDefault: true,
            isActive: true,
        },
    });
};

export const createWorkTitle = async (data: Prisma.WorkTitleCreateInput) => {
    return prisma.workTitle.create({
        data,
    });
};

export const updateWorkTitle = async (id: string, data: Prisma.WorkTitleUpdateInput) => {
    return prisma.workTitle.update({
        where: { id },
        data,
    });
};

export const deleteWorkTitle = async (id: string) => {
    return prisma.workTitle.delete({
        where: { id },
    });
};
