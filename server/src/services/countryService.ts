
import prisma from '../prisma';
import { Prisma } from '../generated/client';

interface CountryData {
    code: string;
    nameZh: string;
    nameEn?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}

export const createCountry = async (data: CountryData) => {
    return prisma.country.create({
        data
    });
};

export const getCountries = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.CountryWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.country.count({ where }),
        prisma.country.findMany({
            where,
            skip,
            take: limit,
            orderBy: { sortOrder: 'asc' },
        }),
    ]);

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

export const getCountryById = async (id: string) => {
    return prisma.country.findUnique({
        where: { id },
    });
};

export const updateCountry = async (id: string, data: Partial<CountryData>) => {
    return prisma.country.update({
        where: { id },
        data,
    });
};

export const deleteCountry = async (id: string) => {
    return prisma.country.delete({
        where: { id },
    });
};
