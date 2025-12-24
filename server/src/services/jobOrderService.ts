import prisma from '../prisma';
import { Prisma } from '@prisma/client';

export const jobOrderService = {
    /**
     * Search job orders with filters
     */
    async searchJobOrders(params: {
        page?: number;
        limit?: number;
        status?: string;
        employerId?: string;
    }) {
        const { page = 1, limit = 50, status, employerId } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.JobOrderWhereInput = {};

        if (status) {
            where.status = status.toLowerCase() as any;
        }

        if (employerId) {
            where.employerId = employerId;
        }

        const [data, total] = await Promise.all([
            prisma.jobOrder.findMany({
                where,
                skip,
                take: limit,
                include: {
                    employer: {
                        select: { id: true, companyName: true },
                    },
                    _count: {
                        select: { interviews: true }, // Counts Interview events
                    },
                },
                orderBy: { orderDate: 'desc' },
            }),
            prisma.jobOrder.count({ where }),
        ]);

        // Map lowercase status to uppercase for frontend
        const mappedData = data.map(job => ({
            ...job,
            status: job.status.toUpperCase(),
        }));

        return {
            data: mappedData,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },

    /**
     * Create job order
     */
    async createJobOrder(data: any) {
        return prisma.jobOrder.create({
            data: {
                employerId: data.employerId,
                title: data.title,
                description: data.description,
                requiredCount: data.requiredCount,
                requiredWorkers: data.requiredCount, // Sync legacy field
                skillRequirements: data.skillRequirements,
                workLocation: data.workLocation,
                jobType: data.jobType,
                status: (data.status?.toLowerCase() || 'open') as any,
            },
            include: {
                employer: {
                    select: { id: true, companyName: true },
                },
            },
        });
    },

    /**
     * Get job order details with interviews
     */
    async getJobOrderById(id: string) {
        const job = await prisma.jobOrder.findUnique({
            where: { id },
            include: {
                employer: true,
                interviews: {
                    include: {
                        candidates: {
                            include: {
                                candidate: {
                                    select: {
                                        id: true,
                                        nameZh: true,
                                        nameEn: true,
                                        passportNo: true,
                                        nationality: true,
                                        status: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { interviewDate: 'desc' },
                },
            },
        });

        if (!job) return null;

        return {
            ...job,
            status: job.status.toUpperCase(),
            // Flatten interviews structure for frontend
            interviews: job.interviews.map(inv => ({
                id: inv.id,
                interviewDate: inv.interviewDate,
                interviewerName: inv.interviewer,
                // Take the first candidate (assuming 1-on-1 for this phase)
                candidate: inv.candidates[0]?.candidate,
                result: inv.candidates[0]?.result.toUpperCase(),
                notes: inv.candidates[0]?.remarks
            })).filter(i => i.candidate) // Filter out empty candidates if any
        };
    },

    /**
     * Update job order
     */
    async updateJobOrder(id: string, data: any) {
        const updateData: any = { ...data };
        if (data.status) {
            updateData.status = data.status.toLowerCase();
        }
        if (data.requiredCount) {
            updateData.requiredWorkers = data.requiredCount; // Sync
        }

        return prisma.jobOrder.update({
            where: { id },
            data: updateData,
        });
    },
};
