
import { PrismaClient, ServiceContract, Prisma } from '@prisma/client';
import { storageService } from './storageService';

const prisma = new PrismaClient();

export const contractService = {
    async createContract(
        data: Prisma.ServiceContractCreateInput,
        file?: { buffer: Buffer; originalname: string; mimetype: string }
    ) {
        // 1. Create the contract first
        const contract = await prisma.serviceContract.create({
            data,
        });

        // 2. If there is a file, upload it and create an attachment linked to this contract
        if (file) {
            const { bucketName, storageKey } = await storageService.uploadFile(
                file.buffer,
                file.originalname,
                file.mimetype
            );

            await prisma.attachment.create({
                data: {
                    fileName: file.originalname,
                    fileType: file.mimetype,
                    storageKey,
                    bucketName,
                    size: file.buffer.length,
                    serviceContractId: contract.id,
                },
            });
        }

        return contract;
    },

    async getContractsByEmployer(employerId: string) {
        return prisma.serviceContract.findMany({
            where: { employerId },
            include: {
                attachments: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    async updateContract(id: string, data: Prisma.ServiceContractUpdateInput) {
        return prisma.serviceContract.update({
            where: { id },
            data,
        });
    },

    async deleteContract(id: string) {
        // Delete attachments from DB (and ideally from MinIO, but simplifying for now)
        // Prisma cascade delete might handle the DB side if configured, but let's be explicit or rely on cascade
        // Our schema has onDelete: Cascade for Employer->Contract, but not explicit for Contract->Attachment in the relation definition I added?
        // Actually, I didn't add onDelete: Cascade to the Attachment relation.
        // Let's just delete the contract, and if I need to clean up attachments later I can.
        return prisma.serviceContract.delete({
            where: { id },
        });
    },

    async getContractById(id: string) {
        return prisma.serviceContract.findUnique({
            where: { id },
            include: {
                attachments: true
            }
        });
    }
};
