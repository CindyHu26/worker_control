
import prisma from '../prisma';
import { Prisma } from '@prisma/client';

interface DepartmentData {
    code: string;
    nameZh: string;
    nameEn?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export const createDepartment = async (data: DepartmentData) => {
    return prisma.department.create({
        data
    });
};

export const getDepartments = async (
    page: number = 1,
    limit: number = 20,
    search?: string
) => {
    const skip = (page - 1) * limit;
    const where: Prisma.DepartmentWhereInput = search
        ? {
            OR: [
                { code: { contains: search, mode: 'insensitive' } },
                { nameZh: { contains: search, mode: 'insensitive' } },
                { nameEn: { contains: search, mode: 'insensitive' } },
            ],
        }
        : {};

    const [total, data] = await prisma.$transaction([
        prisma.department.count({ where }),
        prisma.department.findMany({
            where,
            skip,
            take: limit,
            orderBy: { sortOrder: 'asc' }, // Default sort by sortOrder
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

export const getDepartmentById = async (id: string) => {
    return prisma.department.findUnique({
        where: { id },
    });
};

export const updateDepartment = async (id: string, data: Partial<DepartmentData>) => {
    return prisma.department.update({
        where: { id },
        data,
    });
};

export const deleteDepartment = async (id: string) => {
    // Check for related employees before delete if strict constraints needed,
    // but schema allows or we do soft delete/hard delete. 
    // Requirement implies standard delete usually. 

    // Check if department has employees?
    const employeeCount = await prisma.employee.count({
        where: { departmentCode: { not: undefined } } // This might be tricky as relation key is code or id?
        // Schema says: departmentCode String? @map("department_code")
        // But Department model has `code`. Relational integrity might be loose as it's just code based or? 
        // Prisma schema: model Employee { ... departmentCode ... } NO RELATION defined in schema to Department model.
        // It's a loose reference. So we can just delete. 
    });

    return prisma.department.delete({
        where: { id },
    });
};
