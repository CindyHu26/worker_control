
import prisma from '../prisma';
import { Prisma } from '@prisma/client';

interface ContractData {
    agencyId: string;
    contractNo: string;
    contractType?: string;
    signedDate?: Date;
    validFrom?: Date;
    validTo?: Date;
    summary?: string;
    documentPath?: string;
    status: string;
}

export const createContract = async (data: ContractData) => {
    return prisma.partnerAgencyContract.create({
        data
    });
};

export const getContracts = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.PartnerAgencyContractWhereInput = search
        ? {
            OR: [
                { contractNo: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                {
                    agency: {
                        OR: [
                            { agencyNameZh: { contains: search, mode: 'insensitive' } },
                            { agencyNameEn: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                }
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.partnerAgencyContract.count({ where }),
        prisma.partnerAgencyContract.findMany({
            where,
            skip,
            take: limit,
            include: { // Include Agency Name for display
                agency: {
                    select: {
                        id: true,
                        code: true,
                        agencyNameZh: true,
                        agencyNameEn: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
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

export const getContractById = async (id: string) => {
    return prisma.partnerAgencyContract.findUnique({
        where: { id },
        include: {
            agency: {
                select: {
                    id: true,
                    code: true,
                    agencyNameZh: true,
                }
            }
        }
    });
};

export const updateContract = async (id: string, data: Partial<ContractData>) => {
    return prisma.partnerAgencyContract.update({
        where: { id },
        data,
    });
};

export const deleteContract = async (id: string) => {
    return prisma.partnerAgencyContract.delete({
        where: { id },
    });
};
