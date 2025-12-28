import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getEmployerCategories = async (page: number = 1, pageSize: number = 20, search?: string) => {
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

export const getEmployerCategoryById = async (id: string) => {
    return prisma.applicationCategory.findUnique({
        where: { id },
    });
};

export const createEmployerCategory = async (data: Prisma.ApplicationCategoryCreateInput) => {
    return prisma.applicationCategory.create({
        data,
    });
};

export const updateEmployerCategory = async (id: string, data: Prisma.ApplicationCategoryUpdateInput) => {
    return prisma.applicationCategory.update({
        where: { id },
        data,
    });
};

export const deleteEmployerCategory = async (id: string) => {
    return prisma.applicationCategory.delete({
        where: { id },
    });
};
