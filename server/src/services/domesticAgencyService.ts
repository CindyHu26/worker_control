import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getDomesticAgencies = async (page: number = 1, pageSize: number = 20, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.DomesticAgencyWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { agencyNameZh: { contains: search, mode: 'insensitive' } },
                { agencyNameEn: { contains: search, mode: 'insensitive' } },
                { taxId: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await Promise.all([
        prisma.domesticAgency.count({ where }),
        prisma.domesticAgency.findMany({
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

export const getDomesticAgencyById = async (id: string) => {
    return prisma.domesticAgency.findUnique({
        where: { id },
    });
};

export const createDomesticAgency = async (data: Prisma.DomesticAgencyCreateInput) => {
    return prisma.domesticAgency.create({
        data,
    });
};

export const updateDomesticAgency = async (id: string, data: Prisma.DomesticAgencyUpdateInput) => {
    return prisma.domesticAgency.update({
        where: { id },
        data,
    });
};

export const deleteDomesticAgency = async (id: string) => {
    return prisma.domesticAgency.delete({
        where: { id },
    });
};
