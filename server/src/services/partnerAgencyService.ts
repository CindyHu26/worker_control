import prisma from '../prisma';
import { Prisma } from '../generated/client';

interface PartnerAgencyFilter {
    page?: number;
    limit?: number;
    search?: string;
    country?: string;
}

export const getPartnerAgencies = async (filter: PartnerAgencyFilter) => {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.PartnerAgencyWhereInput = {
        isActive: true,
        ...(filter.search && {
            OR: [
                { code: { contains: filter.search, mode: 'insensitive' } },
                { agencyNameZh: { contains: filter.search, mode: 'insensitive' } },
                { agencyNameEn: { contains: filter.search, mode: 'insensitive' } },
            ],
        }),
        ...(filter.country && { country: filter.country }),
    };

    const [total, data] = await Promise.all([
        prisma.partnerAgency.count({ where }),
        prisma.partnerAgency.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getPartnerAgencyById = async (id: string) => {
    return prisma.partnerAgency.findUnique({
        where: { id },
    });
};

export const createPartnerAgency = async (data: Prisma.PartnerAgencyCreateInput) => {
    return prisma.partnerAgency.create({
        data,
    });
};

export const updatePartnerAgency = async (id: string, data: Prisma.PartnerAgencyUpdateInput) => {
    return prisma.partnerAgency.update({
        where: { id },
        data,
    });
};

export const deletePartnerAgency = async (id: string) => {
    // Soft delete
    return prisma.partnerAgency.update({
        where: { id },
        data: { isActive: false },
    });
};
