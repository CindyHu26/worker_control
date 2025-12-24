import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getIndustries = async (page: number = 1, pageSize: number = 20, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.IndustryWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await Promise.all([
        prisma.industry.count({ where }),
        prisma.industry.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { code: 'asc' },
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

export const getIndustryById = async (id: string) => {
    return prisma.industry.findUnique({
        where: { id },
    });
};

export const createIndustry = async (data: Prisma.IndustryCreateInput) => {
    return prisma.industry.create({
        data,
    });
};

export const updateIndustry = async (id: string, data: Prisma.IndustryUpdateInput) => {
    return prisma.industry.update({
        where: { id },
        data,
    });
};

export const deleteIndustry = async (id: string) => {
    return prisma.industry.delete({
        where: { id },
    });
};
