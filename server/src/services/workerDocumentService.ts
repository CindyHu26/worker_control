import prisma from '../prisma';
import { BadRequestError, ConflictError } from '../types/errors';
import { parseOptionalDate } from '../utils/dateUtils';

export interface RenewDocumentParams {
    type: 'passport' | 'arc';
    newNumber: string;
    issueDate: string;
    expiryDate: string;
    oldNumber?: string;
}

/**
 * Renew worker passport
 * Handles global uniqueness check and archiving current passport
 */
export async function renewPassport(workerId: string, data: {
    newNumber: string;
    issueDate: string;
    expiryDate: string;
}) {
    return prisma.$transaction(async (tx) => {
        // 1. Check Global Uniqueness
        const conflict = await tx.workerPassport.findFirst({
            where: { passportNumber: data.newNumber }
        });

        if (conflict) {
            throw new ConflictError(`Passport number ${data.newNumber} already exists`);
        }

        // 2. Archive Current
        await tx.workerPassport.updateMany({
            where: { workerId, isCurrent: true },
            data: { isCurrent: false }
        });

        // 3. Create New
        const newPassport = await tx.workerPassport.create({
            data: {
                workerId,
                passportNumber: data.newNumber,
                issueDate: parseOptionalDate(data.issueDate) || new Date(),
                expiryDate: parseOptionalDate(data.expiryDate) || new Date(),
                isCurrent: true
            }
        });

        return newPassport;
    });
}

/**
 * Renew worker ARC (Alien Resident Certificate)
 * Handles global uniqueness check and archiving current ARC
 */
export async function renewARC(workerId: string, data: {
    newNumber: string;
    issueDate: string;
    expiryDate: string;
}) {
    return prisma.$transaction(async (tx) => {
        // 1. Check Global Uniqueness
        const conflict = await tx.workerArc.findFirst({
            where: { arcNumber: data.newNumber }
        });

        if (conflict) {
            throw new ConflictError(`ARC number ${data.newNumber} already exists`);
        }

        // 2. Archive Current
        await tx.workerArc.updateMany({
            where: { workerId, isCurrent: true },
            data: { isCurrent: false }
        });

        // 3. Create New
        const newARC = await tx.workerArc.create({
            data: {
                workerId,
                arcNumber: data.newNumber,
                issueDate: parseOptionalDate(data.issueDate) || new Date(),
                expiryDate: parseOptionalDate(data.expiryDate) || new Date(),
                isCurrent: true
            }
        });

        return newARC;
    });
}

/**
 * Renew document (passport or ARC)  
 * Unified interface for document renewal
 */
export async function renewDocument(workerId: string, params: RenewDocumentParams) {
    const { type, newNumber, issueDate, expiryDate } = params;

    if (!newNumber || !issueDate || !expiryDate) {
        throw new BadRequestError('Missing required fields: newNumber, issueDate, expiryDate');
    }

    if (type === 'passport') {
        return await renewPassport(workerId, { newNumber, issueDate, expiryDate });
    } else if (type === 'arc') {
        return await renewARC(workerId, { newNumber, issueDate, expiryDate });
    } else {
        throw new BadRequestError('Invalid document type. Must be "passport" or "arc"');
    }
}
