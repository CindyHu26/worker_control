
import prisma from '../prisma';
import { Prisma } from '../generated/client';

interface ContractTypeData {
    code: string;
    name: string;
    isControlled?: boolean;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const createContractType = async (data: ContractTypeData) => {
    return prisma.contractType.create({
        data
    });
};

export const getContractTypes = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.ContractTypeWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.contractType.count({ where }),
        prisma.contractType.findMany({
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

export const getContractTypeById = async (id: string) => {
    return prisma.contractType.findUnique({
        where: { id },
    });
};

export const updateContractType = async (id: string, data: Partial<ContractTypeData>) => {
    return prisma.contractType.update({
        where: { id },
        data,
    });
};

export const deleteContractType = async (id: string) => {
    return prisma.contractType.delete({
        where: { id },
    });
};
