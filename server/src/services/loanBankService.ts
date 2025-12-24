
import prisma from '../prisma';
import { Prisma } from '@prisma/client';

interface LoanBankData {
    code: string;
    nameZh: string;
    nameEn?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const createLoanBank = async (data: LoanBankData) => {
    return prisma.loanBank.create({
        data
    });
};

export const getLoanBanks = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.LoanBankWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.loanBank.count({ where }),
        prisma.loanBank.findMany({
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

export const getLoanBankById = async (id: string) => {
    return prisma.loanBank.findUnique({
        where: { id },
    });
};

export const updateLoanBank = async (id: string, data: Partial<LoanBankData>) => {
    return prisma.loanBank.update({
        where: { id },
        data,
    });
};

export const deleteLoanBank = async (id: string) => {
    return prisma.loanBank.delete({
        where: { id },
    });
};
