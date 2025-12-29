import prisma from '../prisma';
import type { Employer, Prisma } from '@prisma/client';
import { ResourceNotFoundError } from '../types/errors';
import {
    IEmployerRepository,
    EmployerSearchParams,
    EmployerWithRelations
} from './IEmployerRepository';

/**
 * Prisma implementation of Employer Repository
 */
export class PrismaEmployerRepository implements IEmployerRepository {
    /**
     * Standard relations to include when fetching employer details
     */
    private getFullInclude(): Prisma.EmployerInclude {
        return {
            corporateInfo: true,
            individualInfo: true,
            factories: true,
            recruitmentLetters: {
                orderBy: { issueDate: 'desc' } as any
            },
            industryRecognitions: {
                orderBy: { issueDate: 'desc' } as any
            },
            category: true,
            _count: {
                select: { deployments: true }
            }
        };
    }

    /**
     * Build where clause for employer search
     */
    private buildWhereClause(params: EmployerSearchParams): Prisma.EmployerWhereInput {
        const where: Prisma.EmployerWhereInput = {};
        const andConditions: Prisma.EmployerWhereInput[] = [];

        // Keyword search
        if (params.q) {
            andConditions.push({
                OR: [
                    { companyName: { contains: params.q } },
                    { shortName: { contains: params.q } },
                    { taxId: { contains: params.q } },
                    { responsiblePerson: { contains: params.q } }
                ]
            });
        }

        // Type filter
        if (params.type === 'corporate') {
            andConditions.push({ corporateInfo: { isNot: null } });
        } else if (params.type === 'individual') {
            andConditions.push({ individualInfo: { isNot: null } });
        }

        // Category filter
        if (params.category && params.category !== 'ALL') {
            andConditions.push({
                category: { code: params.category }
            });
        }

        if (andConditions.length > 0) {
            where.AND = andConditions;
        }

        return where;
    }

    async create(data: Prisma.EmployerCreateInput): Promise<Employer> {
        return await prisma.employer.create({ data });
    }

    async findById(id: string, includeRelations = true): Promise<EmployerWithRelations | null> {
        const include = includeRelations ? this.getFullInclude() : undefined;

        return await prisma.employer.findUnique({
            where: { id },
            include
        }) as EmployerWithRelations | null;
    }

    async findByTaxId(taxId: string): Promise<Employer | null> {
        return await prisma.employer.findFirst({
            where: { taxId }
        });
    }

    async findMany(params: EmployerSearchParams): Promise<EmployerWithRelations[]> {
        const { page = 1, limit = 10 } = params;
        const skip = (page - 1) * limit;

        return await prisma.employer.findMany({
            where: this.buildWhereClause(params),
            include: {
                _count: {
                    select: { deployments: true }
                },
                category: true,
                corporateInfo: {
                    select: {
                        institutionCode: true,
                        bedCount: true
                    }
                },
                individualInfo: {
                    select: {
                        patientName: true,
                        careAddress: true
                    }
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        }) as EmployerWithRelations[];
    }

    async count(params: EmployerSearchParams): Promise<number> {
        return await prisma.employer.count({
            where: this.buildWhereClause(params)
        });
    }

    async update(id: string, data: Prisma.EmployerUpdateInput): Promise<Employer> {
        try {
            return await prisma.employer.update({
                where: { id },
                data
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ResourceNotFoundError('Employer', id);
            }
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            await prisma.employer.delete({
                where: { id }
            });
        } catch (error: any) {
            if (error.code === 'P2025') {
                throw new ResourceNotFoundError('Employer', id);
            }
            throw error;
        }
    }

    async exists(id: string): Promise<boolean> {
        const count = await prisma.employer.count({
            where: { id }
        });
        return count > 0;
    }

    async getSummary(id: string): Promise<any> {
        const employer = await prisma.employer.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        deployments: true,
                        recruitmentLetters: true
                    }
                },
                recruitmentLetters: {
                    select: {
                        id: true,
                        approvedQuota: true,
                        usedQuota: true
                    }
                }
            }
        });

        if (!employer) {
            return null;
        }

        const totalQuota = employer.recruitmentLetters.reduce(
            (sum, letter) => sum + (letter.approvedQuota || 0), 0
        );
        const usedQuota = employer.recruitmentLetters.reduce(
            (sum, letter) => sum + (letter.usedQuota || 0), 0
        );

        return {
            totalDeployments: employer._count.deployments,
            totalRecruitmentLetters: employer._count.recruitmentLetters,
            totalQuota,
            usedQuota,
            availableQuota: totalQuota - usedQuota
        };
    }
}

// Export singleton instance
export const employerRepository = new PrismaEmployerRepository();
