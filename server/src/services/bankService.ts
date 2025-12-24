import prisma from '../prisma';
import {
    CreateBankInputSchema,
    UpdateBankInputSchema,
    BankSearchParamsSchema,
    type BankSearchParams,
    type CreateBankInput,
    type UpdateBankInput
} from '@worker-control/shared';
import { ResourceNotFoundError, ValidationError } from '../types/errors';

/**
 * Get all banks with pagination
 */
export async function getBanks(params: BankSearchParams) {
    const validated = BankSearchParamsSchema.parse(params);
    const { page, limit, q, isActive } = validated;
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (q) {
        whereClause.OR = [
            { code: { contains: q, mode: 'insensitive' } },
            { bankName: { contains: q, mode: 'insensitive' } },
            { bankNameEn: { contains: q, mode: 'insensitive' } }
        ];
    }

    if (isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
    }

    const [total, banks] = await Promise.all([
        prisma.bank.count({ where: whereClause }),
        prisma.bank.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    return {
        data: banks,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

/**
 * Get Bank By ID
 */
export async function getBankById(id: string) {
    const bank = await prisma.bank.findUnique({
        where: { id }
    });

    if (!bank) {
        throw new ResourceNotFoundError('Bank', id);
    }
    return bank;
}

/**
 * Create Bank
 */
export async function createBank(input: CreateBankInput) {
    const validated = CreateBankInputSchema.parse(input);

    // Check duplicate code
    const existing = await prisma.bank.findUnique({
        where: { code: validated.code }
    });

    if (existing) {
        throw new ValidationError('Bank code already exists', { code: validated.code });
    }

    return prisma.bank.create({
        data: validated
    });
}

/**
 * Update Bank
 */
export async function updateBank(id: string, input: UpdateBankInput) {
    const validated = UpdateBankInputSchema.parse(input);

    // Check existence
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing) {
        throw new ResourceNotFoundError('Bank', id);
    }

    // Check duplicate code if changing code
    if (validated.code && validated.code !== existing.code) {
        const duplicate = await prisma.bank.findUnique({
            where: { code: validated.code }
        });
        if (duplicate) {
            throw new ValidationError('Bank code already exists', { code: validated.code });
        }
    }

    return prisma.bank.update({
        where: { id },
        data: validated
    });
}

/**
 * Delete Bank
 */
export async function deleteBank(id: string) {
    // Check references
    const bank = await prisma.bank.findUnique({
        where: { id },
        include: {
            _count: {
                select: { agencyAccounts: true }
            }
        }
    });

    if (!bank) {
        throw new ResourceNotFoundError('Bank', id);
    }

    if (bank._count.agencyAccounts > 0) {
        throw new ValidationError('Cannot delete bank with associated agency accounts.');
    }

    return prisma.bank.delete({
        where: { id }
    });
}
