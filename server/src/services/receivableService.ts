import prisma from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { billingItemDefinitionService } from './billingItemDefinitionService';

// ==========================================
// Receivable Service - AR/AP Core Logic
// ==========================================

// Note: Using (prisma as any) to access new models since the extended client
// loses type inference with $extends(). This is a known Prisma limitation.

export interface CreateReceivableInput {
    workerId: string;
    employerId: string;
    billingCycle: string;
    itemDefinitionId: string;
    amount: number;
    dueDate: Date;
    type?: 'REGULAR' | 'ADJUSTMENT';
    originalReceivableId?: string;
    createdBy?: string;
}

export interface RecordPaymentInput {
    receivableId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: 'CASH' | 'TRANSFER' | 'SALARY_DEDUCTION';
    note?: string;
    createdBy: string;
}

export interface QueryReceivablesFilter {
    employerIds?: string[];
    workerIds?: string[];
    itemDefinitionIds?: string[];
    billingCycles?: string[];
    dateRange?: { start: Date; end: Date };
    status?: string[];
    type?: string;
}

class ReceivableService {
    // ==========================================
    // Core CRUD Operations
    // ==========================================

    /**
     * Create a new receivable (應收帳款)
     * Automatically snapshots the item name for historical accuracy
     */
    async createReceivable(input: CreateReceivableInput) {
        // Get item name (with employer alias if applicable)
        const itemName = await billingItemDefinitionService.getItemNameForEmployer(
            input.itemDefinitionId,
            input.employerId
        );

        const receivable = await (prisma as any).receivable.create({
            data: {
                workerId: input.workerId,
                employerId: input.employerId,
                billingCycle: input.billingCycle,
                itemDefinitionId: input.itemDefinitionId,
                itemName,
                amount: input.amount,
                dueDate: input.dueDate,
                status: 'PENDING',
                type: input.type ?? 'REGULAR',
                originalReceivableId: input.originalReceivableId,
                createdBy: input.createdBy
            },
            include: {
                worker: { select: { id: true, englishName: true } },
                employer: { select: { id: true, companyName: true } },
                itemDefinition: true
            }
        });

        // Create audit log
        if (input.createdBy) {
            await this.createAuditLog(receivable.id, 'CREATE', null, null, null, null, input.createdBy);
        }

        return receivable;
    }

    /**
     * Get receivable by ID with all related data
     */
    async getReceivableById(id: string) {
        const receivable = await (prisma as any).receivable.findUnique({
            where: { id },
            include: {
                worker: { select: { id: true, englishName: true, chineseName: true } },
                employer: { select: { id: true, companyName: true } },
                itemDefinition: true,
                transactions: {
                    where: { isVoided: false },
                    orderBy: { paymentDate: 'asc' }
                },
                originalReceivable: true,
                adjustments: true,
                auditLogs: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });

        if (receivable) {
            return {
                ...receivable,
                balance: this.calculateBalance(receivable.amount, receivable.transactions)
            };
        }

        return null;
    }

    /**
     * Query receivables with multi-dimensional filtering
     */
    async queryReceivables(filter: QueryReceivablesFilter) {
        const where: Record<string, unknown> = {};

        if (filter.employerIds && filter.employerIds.length > 0 && !filter.employerIds.includes('all')) {
            where.employerId = { in: filter.employerIds };
        }

        if (filter.workerIds && filter.workerIds.length > 0 && !filter.workerIds.includes('all')) {
            where.workerId = { in: filter.workerIds };
        }

        if (filter.itemDefinitionIds && filter.itemDefinitionIds.length > 0) {
            where.itemDefinitionId = { in: filter.itemDefinitionIds };
        }

        if (filter.billingCycles && filter.billingCycles.length > 0) {
            where.billingCycle = { in: filter.billingCycles };
        }

        if (filter.dateRange) {
            where.dueDate = {
                gte: filter.dateRange.start,
                lte: filter.dateRange.end
            };
        }

        if (filter.status && filter.status.length > 0) {
            where.status = { in: filter.status };
        }

        if (filter.type) {
            where.type = filter.type;
        }

        const receivables = await (prisma as any).receivable.findMany({
            where,
            include: {
                worker: { select: { id: true, englishName: true, chineseName: true } },
                employer: { select: { id: true, companyName: true } },
                itemDefinition: true,
                transactions: {
                    where: { isVoided: false },
                    orderBy: { paymentDate: 'asc' }
                }
            },
            orderBy: [{ dueDate: 'asc' }, { employerId: 'asc' }, { workerId: 'asc' }]
        });

        // Calculate balances
        return receivables.map((r: any) => ({
            ...r,
            balance: this.calculateBalance(r.amount, r.transactions),
            paidAmount: this.calculatePaidAmount(r.transactions)
        }));
    }

    // ==========================================
    // Payment Recording (分期付款)
    // ==========================================

    /**
     * Record a payment transaction for a receivable
     * Automatically updates receivable status based on balance
     */
    async recordPayment(input: RecordPaymentInput) {
        return (prisma as any).$transaction(async (tx: any) => {
            // Get current receivable
            const receivable = await tx.receivable.findUnique({
                where: { id: input.receivableId },
                include: {
                    transactions: { where: { isVoided: false } }
                }
            });

            if (!receivable) {
                throw new Error('Receivable not found');
            }

            if (receivable.status === 'CANCELLED') {
                throw new Error('Cannot add payment to cancelled receivable');
            }

            // Create transaction
            const transaction = await tx.paymentTransaction.create({
                data: {
                    receivableId: input.receivableId,
                    amount: input.amount,
                    paymentDate: input.paymentDate,
                    paymentMethod: input.paymentMethod,
                    note: input.note,
                    createdBy: input.createdBy
                }
            });

            // Calculate new balance
            const allTransactions = [...receivable.transactions, transaction];
            const balance = this.calculateBalance(receivable.amount, allTransactions);

            // Determine new status
            let newStatus = receivable.status;
            if (Number(balance) === 0) {
                newStatus = 'PAID';
            } else if (Number(balance) < Number(receivable.amount)) {
                newStatus = 'PARTIAL';
            }

            // Update receivable status if changed
            if (newStatus !== receivable.status) {
                await tx.receivable.update({
                    where: { id: input.receivableId },
                    data: { status: newStatus }
                });

                // Create audit log for status change
                await tx.accountingAuditLog.create({
                    data: {
                        receivableId: input.receivableId,
                        action: 'UPDATE',
                        fieldChanged: 'status',
                        oldValue: receivable.status,
                        newValue: newStatus,
                        reason: `Payment of ${input.amount} recorded`,
                        createdBy: input.createdBy
                    }
                });
            }

            return transaction;
        });
    }

    // ==========================================
    // Adjustment Mechanism (補收/退款)
    // ==========================================

    /**
     * Create an adjustment receivable linked to original
     * Used for retroactive changes (e.g., rent change discovered later)
     */
    async createAdjustment(
        originalReceivableId: string,
        amount: number,
        reason: string,
        createdBy: string
    ) {
        const original = await (prisma as any).receivable.findUnique({
            where: { id: originalReceivableId }
        });

        if (!original) {
            throw new Error('Original receivable not found');
        }

        // Create adjustment receivable
        const adjustment = await this.createReceivable({
            workerId: original.workerId,
            employerId: original.employerId,
            billingCycle: original.billingCycle,
            itemDefinitionId: original.itemDefinitionId,
            amount,
            dueDate: new Date(),
            type: 'ADJUSTMENT',
            originalReceivableId,
            createdBy
        });

        // Create audit log on original
        await this.createAuditLog(
            originalReceivableId,
            'ADJUSTMENT',
            null,
            null,
            null,
            `Adjustment created: ${amount} - ${reason}`,
            createdBy
        );

        return adjustment;
    }

    // ==========================================
    // Void Mechanism (作廢交易)
    // ==========================================

    /**
     * Void a transaction (cannot delete for audit trail)
     * Recalculates receivable status after voiding
     */
    async voidTransaction(transactionId: string, reason: string, voidedBy: string) {
        return (prisma as any).$transaction(async (tx: any) => {
            const transaction = await tx.paymentTransaction.findUnique({
                where: { id: transactionId },
                include: { receivable: true }
            });

            if (!transaction) {
                throw new Error('Transaction not found');
            }

            if (transaction.isVoided) {
                throw new Error('Transaction is already voided');
            }

            // Mark transaction as voided
            await tx.paymentTransaction.update({
                where: { id: transactionId },
                data: {
                    isVoided: true,
                    voidedAt: new Date(),
                    voidedBy,
                    voidReason: reason
                }
            });

            // Recalculate receivable status
            const remainingTransactions = await tx.paymentTransaction.findMany({
                where: { receivableId: transaction.receivableId, isVoided: false }
            });

            const balance = this.calculateBalance(
                transaction.receivable.amount,
                remainingTransactions
            );

            let newStatus: string;
            if (Number(balance) === Number(transaction.receivable.amount)) {
                newStatus = 'PENDING';
            } else if (Number(balance) === 0) {
                newStatus = 'PAID';
            } else {
                newStatus = 'PARTIAL';
            }

            await tx.receivable.update({
                where: { id: transaction.receivableId },
                data: { status: newStatus }
            });

            // Create audit log
            await tx.accountingAuditLog.create({
                data: {
                    receivableId: transaction.receivableId,
                    action: 'VOID',
                    fieldChanged: 'transaction',
                    oldValue: `Transaction ${transactionId}: ${transaction.amount}`,
                    newValue: 'VOIDED',
                    reason,
                    createdBy: voidedBy
                }
            });

            return { success: true, newStatus };
        });
    }

    // ==========================================
    // Helper Methods
    // ==========================================

    /**
     * Calculate remaining balance: amount - sum(valid transactions)
     */
    private calculateBalance(
        amount: Decimal | number,
        transactions: Array<{ amount: Decimal | number; isVoided?: boolean }>
    ): number {
        const validTransactions = transactions.filter(t => !t.isVoided);
        const totalPaid = validTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );
        return Number(amount) - totalPaid;
    }

    /**
     * Calculate total paid amount
     */
    private calculatePaidAmount(
        transactions: Array<{ amount: Decimal | number; isVoided?: boolean }>
    ): number {
        const validTransactions = transactions.filter(t => !t.isVoided);
        return validTransactions.reduce(
            (sum, t) => sum + Number(t.amount),
            0
        );
    }

    /**
     * Create audit log entry
     */
    private async createAuditLog(
        receivableId: string,
        action: string,
        fieldChanged: string | null,
        oldValue: string | null,
        newValue: string | null,
        reason: string | null,
        createdBy: string
    ) {
        return (prisma as any).accountingAuditLog.create({
            data: {
                receivableId,
                action,
                fieldChanged,
                oldValue,
                newValue,
                reason,
                createdBy
            }
        });
    }

    // ==========================================
    // 36-Period Matrix Data
    // ==========================================

    /**
     * Get receivables matrix for a deployment (36 periods)
     * Returns data structured for matrix view display
     */
    async getMatrixForDeployment(deploymentId: string) {
        const deployment = await prisma.deployment.findUnique({
            where: { id: deploymentId },
            include: {
                worker: true,
                employer: true,
                billingPlan: {
                    include: {
                        items: { orderBy: { billingDate: 'asc' } }
                    }
                }
            }
        });

        if (!deployment) {
            throw new Error('Deployment not found');
        }

        // Get all billing item definitions
        const itemDefinitions = await billingItemDefinitionService.list({ isActive: true });

        // Get receivables for this worker
        const receivables = await (prisma as any).receivable.findMany({
            where: { workerId: deployment.workerId },
            include: {
                transactions: { where: { isVoided: false } }
            },
            orderBy: { dueDate: 'asc' }
        });

        // Structure data for matrix view
        const periods: string[] = [];
        const startDate = new Date(deployment.startDate);

        for (let i = 0; i < 36; i++) {
            const periodDate = new Date(startDate);
            periodDate.setMonth(periodDate.getMonth() + i);
            periods.push(
                `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`
            );
        }

        // Build matrix structure
        const matrix = periods.map(period => {
            const periodItems: Record<string, {
                amount: number;
                paidAmount: number;
                status: string;
                receivableId?: string;
            }> = {};

            for (const def of itemDefinitions) {
                const receivable = receivables.find(
                    (r: any) => r.billingCycle === period && r.itemDefinitionId === def.id
                );

                if (receivable) {
                    const paidAmount = this.calculatePaidAmount(receivable.transactions);
                    periodItems[def.code] = {
                        amount: Number(receivable.amount),
                        paidAmount: paidAmount,
                        status: receivable.status,
                        receivableId: receivable.id
                    };
                } else {
                    periodItems[def.code] = {
                        amount: 0,
                        paidAmount: 0,
                        status: 'N/A'
                    };
                }
            }

            return {
                period,
                items: periodItems
            };
        });

        return {
            deployment: {
                id: deployment.id,
                workerId: deployment.workerId,
                workerName: deployment.worker.englishName,
                employerId: deployment.employerId,
                employerName: deployment.employer.companyName,
                startDate: deployment.startDate
            },
            columns: itemDefinitions.map((d: any) => ({ code: d.code, name: d.name })),
            matrix,
            billingPlan: deployment.billingPlan
        };
    }
}

export const receivableService = new ReceivableService();
