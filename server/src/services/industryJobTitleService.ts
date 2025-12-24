import { Prisma, IndustryJobTitle } from '@prisma/client';
import prisma from '../prisma';

export const getIndustryJobTitles = async (page: number, pageSize: number, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.IndustryJobTitleWhereInput = {
        ...(search && {
            OR: [
                { titleZh: { contains: search, mode: 'insensitive' } },
                { titleEn: { contains: search, mode: 'insensitive' } },
                { industry: { nameZh: { contains: search, mode: 'insensitive' } } }
            ]
        })
    };

    const [data, total] = await Promise.all([
        prisma.industryJobTitle.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                industry: {
                    select: {
                        id: true,
                        nameZh: true,
                        code: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        }),
        prisma.industryJobTitle.count({ where })
    ]);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    };
};

export const getIndustryJobTitleById = async (id: string) => {
    return prisma.industryJobTitle.findUnique({
        where: { id },
        include: {
            industry: true
        }
    });
};

export const createIndustryJobTitle = async (data: Prisma.IndustryJobTitleCreateInput) => {
    return prisma.industryJobTitle.create({
        data,
        include: {
            industry: true
        }
    });
};

export const updateIndustryJobTitle = async (id: string, data: Prisma.IndustryJobTitleUpdateInput) => {
    return prisma.industryJobTitle.update({
        where: { id },
        data,
        include: {
            industry: true
        }
    });
};

export const deleteIndustryJobTitle = async (id: string) => {
    return prisma.industryJobTitle.delete({
        where: { id }
    });
};
