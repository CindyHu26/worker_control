import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const getEmployees = async (page: number = 1, pageSize: number = 20, search?: string) => {
    const skip = (page - 1) * pageSize;
    const where: Prisma.EmployeeWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { fullName: { contains: search, mode: 'insensitive' } },
                { employeeNumber: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await Promise.all([
        prisma.employee.count({ where }),
        prisma.employee.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { code: 'asc' },
            include: {
                domesticAgency: {
                    select: {
                        id: true,
                        agencyNameZh: true,
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

export const getEmployeeById = async (id: string) => {
    return prisma.employee.findUnique({
        where: { id },
        include: {
            domesticAgency: {
                select: {
                    id: true,
                    agencyNameZh: true,
                },
            },
        },
    });
};

export const createEmployee = async (data: Prisma.EmployeeCreateInput) => {
    return prisma.employee.create({
        data,
    });
};

export const updateEmployee = async (id: string, data: Prisma.EmployeeUpdateInput) => {
    return prisma.employee.update({
        where: { id },
        data,
    });
};

export const deleteEmployee = async (id: string) => {
    return prisma.employee.delete({
        where: { id },
    });
};
