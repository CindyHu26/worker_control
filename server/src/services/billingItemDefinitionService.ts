import prisma from '../prisma';
import { BillingItemCategory } from '@prisma/client';

// ==========================================
// Billing Item Definition Service
// ==========================================

// Note: Using (prisma as any) to access new models since the extended client
// loses type inference with $extends(). This is a known Prisma limitation.

export interface CreateBillingItemDefinitionInput {
    code: string;
    name: string;
    nameEn?: string;
    category: BillingItemCategory;
    isSystem?: boolean;
    isActive?: boolean;
    sortOrder?: number;
}

export interface UpdateBillingItemDefinitionInput {
    name?: string;
    nameEn?: string;
    category?: BillingItemCategory;
    isActive?: boolean;
    sortOrder?: number;
}

class BillingItemDefinitionService {
    /**
     * List all billing item definitions with optional filtering
     */
    async list(options?: { isActive?: boolean; category?: BillingItemCategory }) {
        const where: Record<string, unknown> = {};

        if (options?.isActive !== undefined) {
            where.isActive = options.isActive;
        }
        if (options?.category) {
            where.category = options.category;
        }

        return (prisma as any).billingItemDefinition.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: {
                employerAliases: {
                    include: {
                        employer: { select: { id: true, companyName: true } }
                    }
                }
            }
        });
    }

    /**
     * Get a single billing item definition by ID
     */
    async getById(id: string) {
        return (prisma as any).billingItemDefinition.findUnique({
            where: { id },
            include: {
                employerAliases: {
                    include: {
                        employer: { select: { id: true, companyName: true } }
                    }
                }
            }
        });
    }

    /**
     * Get billing item definition by code
     */
    async getByCode(code: string) {
        return (prisma as any).billingItemDefinition.findUnique({
            where: { code }
        });
    }

    /**
     * Create a new billing item definition
     */
    async create(input: CreateBillingItemDefinitionInput) {
        return (prisma as any).billingItemDefinition.create({
            data: {
                code: input.code,
                name: input.name,
                nameEn: input.nameEn,
                category: input.category,
                isSystem: input.isSystem ?? false,
                isActive: input.isActive ?? true,
                sortOrder: input.sortOrder ?? 0
            }
        });
    }

    /**
     * Update a billing item definition
     * System items can only have name/sortOrder/isActive updated
     */
    async update(id: string, input: UpdateBillingItemDefinitionInput) {
        const existing = await (prisma as any).billingItemDefinition.findUnique({
            where: { id }
        });

        if (!existing) {
            throw new Error('Billing item definition not found');
        }

        // System items have restrictions on what can be changed
        if (existing.isSystem) {
            const { category, ...allowedUpdates } = input;
            return (prisma as any).billingItemDefinition.update({
                where: { id },
                data: allowedUpdates
            });
        }

        return (prisma as any).billingItemDefinition.update({
            where: { id },
            data: input
        });
    }

    /**
     * Delete a billing item definition (only non-system items)
     */
    async delete(id: string) {
        const existing = await (prisma as any).billingItemDefinition.findUnique({
            where: { id },
            include: { receivables: { take: 1 } }
        });

        if (!existing) {
            throw new Error('Billing item definition not found');
        }

        if (existing.isSystem) {
            throw new Error('Cannot delete system billing item definition');
        }

        if (existing.receivables && existing.receivables.length > 0) {
            throw new Error('Cannot delete billing item with existing receivables');
        }

        return (prisma as any).billingItemDefinition.delete({
            where: { id }
        });
    }

    // ==========================================
    // Employer Alias Management
    // ==========================================

    /**
     * Get custom item name for a specific employer
     * Falls back to default name if no alias exists
     */
    async getItemNameForEmployer(definitionId: string, employerId: string): Promise<string> {
        const alias = await (prisma as any).employerBillingAlias.findUnique({
            where: {
                employerId_definitionId: { employerId, definitionId }
            }
        });

        if (alias) {
            return alias.customName;
        }

        const definition = await (prisma as any).billingItemDefinition.findUnique({
            where: { id: definitionId }
        });

        return definition?.name ?? 'Unknown';
    }

    /**
     * Set or update employer-specific alias for a billing item
     */
    async setEmployerAlias(employerId: string, definitionId: string, customName: string) {
        return (prisma as any).employerBillingAlias.upsert({
            where: {
                employerId_definitionId: { employerId, definitionId }
            },
            update: { customName },
            create: { employerId, definitionId, customName }
        });
    }

    /**
     * Remove employer-specific alias
     */
    async removeEmployerAlias(employerId: string, definitionId: string) {
        return (prisma as any).employerBillingAlias.delete({
            where: {
                employerId_definitionId: { employerId, definitionId }
            }
        });
    }

    /**
     * Get all aliases for an employer
     */
    async getEmployerAliases(employerId: string) {
        return (prisma as any).employerBillingAlias.findMany({
            where: { employerId },
            include: {
                definition: true
            }
        });
    }
}

export const billingItemDefinitionService = new BillingItemDefinitionService();
