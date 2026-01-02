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

        const where: Prisma.JobOrderWhereInput = {
            isDeleted: false,
        };

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
                        select: { id: true, companyName: true, totalQuota: true },
                    },
                    _count: {
                        select: { interviews: true },
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
     * Check employer quota availability
     * Returns quota info and whether employer has remaining quota
     */
    async checkEmployerQuota(employerId: string) {
        const employer = await prisma.employer.findUnique({
            where: { id: employerId },
            select: {
                id: true,
                companyName: true,
                totalQuota: true,
                _count: {
                    select: {
                        deployments: {
                            where: { status: 'active' },
                        },
                    },
                },
            },
        });

        if (!employer) {
            return { hasQuota: false, message: '雇主不存在' };
        }

        const usedQuota = employer._count.deployments;
        const remainingQuota = employer.totalQuota - usedQuota;

        return {
            hasQuota: remainingQuota > 0,
            totalQuota: employer.totalQuota,
            usedQuota,
            remainingQuota,
            message: remainingQuota > 0
                ? `剩餘名額：${remainingQuota} 人`
                : '名額已滿，請先申請招募函',
        };
    },

    /**
     * Validate Job Order Quota
     */
    async validateJobOrderQuota(jobOrderId: string, workerCountry?: string) {
        const jobOrder = await prisma.jobOrder.findUnique({
            where: { id: jobOrderId },
            select: {
                id: true,
                validUntil: true,
                quota: true,
                usedQuota: true,
                countryCode: true,
                status: true,
                recruitmentType: true,
            }
        });

        if (!jobOrder) {
            throw new Error("Job Order not found");
        }

        // Rule 1: Expiry
        if (jobOrder.validUntil && new Date() > jobOrder.validUntil) {
            throw new Error("Recruitment Letter Expired");
        }

        // Rule 2: Availability
        // For 'supplementary' (遞補), we might need to check if we are still within the original quota limits if linked?
        // But the requirement says "usedQuota >= quota"
        if (jobOrder.quota > 0 && jobOrder.usedQuota >= jobOrder.quota) {
            throw new Error("No Quota Remaining");
        }

        // Rule 3: Country
        if (jobOrder.countryCode && workerCountry) {
            // Assuming 3-letter codes like 'VNM', 'IDN', 'PHL', 'THA'
            // If jobOrder.countryCode is 'VN' and worker is 'VNM', we need to normalize.
            // Let's assume strict match or simple inclusion for now.
            if (jobOrder.countryCode !== workerCountry && !workerCountry.includes(jobOrder.countryCode)) {
                throw new Error(`Country Mismatch: Job Order is for ${jobOrder.countryCode}`);
            }
        }

        return { valid: true, jobOrder };
    },

    /**
     * Create job order with quota check
     */
    async createJobOrder(data: any) {
        // [Logic Update]
        // If it's a "Recruitment Letter" style, we rely on 'quota' field.
        // Legacy "checkEmployerQuota" might still be relevant for overall employer limits, but 
        // the Job Order itself defines the specific approval.

        // Check employer existence
        const employer = await prisma.employer.findUnique({
            where: { id: data.employerId },
            include: { category: true }
        });

        if (!employer) throw new Error("Employer not found");

        const categoryCode = employer.category?.code || 'UNKNOWN';
        const isIntermediate = categoryCode.startsWith('MID_');

        if (data.salary) {
            const { validateSalary } = require('../utils/salaryValidation');
            validateSalary(categoryCode, Number(data.salary), isIntermediate);
        }

        // Auto-calculate validUntil if not provided but issueDate is
        let validUntil = data.validUntil;
        if (!validUntil && data.issueDate) {
            // Default logic: +6 months or +1 year?
            // Let's leave it null if not provided, frontend should handle defaults.
        }

        return prisma.jobOrder.create({
            data: {
                employerId: data.employerId,
                title: data.title,
                description: data.description,
                requiredCount: data.quota || data.requiredCount || 1, // Sync
                requiredWorkers: data.quota || data.requiredCount || 1, // Sync
                quota: data.quota ? parseInt(data.quota) : 1, // Default to 1 if not set
                recruitmentType: data.recruitmentType,
                letterNumber: data.letterNumber,
                countryCode: data.countryCode,
                workTitleCode: data.workTitleCode,
                issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                parentJobOrderId: data.parentJobOrderId,
                attributes: data.attributes,

                skillRequirements: data.skillRequirements,
                workLocation: data.workLocation,
                jobType: data.jobType,
                nationalityPreference: data.nationalityPreference,
                genderPreference: data.genderPreference?.toLowerCase() as any,
                status: (data.status?.toLowerCase() || 'open') as any,
            },
            include: {
                employer: {
                    select: { id: true, companyName: true, totalQuota: true },
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
                employer: {
                    select: {
                        id: true,
                        companyName: true,
                        totalQuota: true,
                    },
                },
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

        // Get quota info for employer
        const quotaInfo = await this.checkEmployerQuota(job.employerId);

        return {
            ...job,
            status: job.status.toUpperCase(),
            quotaInfo,
            // Flatten interviews structure for frontend
            interviews: job.interviews.map(inv => ({
                id: inv.id,
                interviewDate: inv.interviewDate,
                interviewerName: inv.interviewer,
                candidate: inv.candidates[0]?.candidate,
                result: inv.candidates[0]?.result.toUpperCase(),
                notes: inv.candidates[0]?.remarks
            })).filter(i => i.candidate)
        };
    },

    /**
     * Update job order with auto status calculation
     */
    async updateJobOrder(id: string, data: any) {
        const updateData: any = { ...data };

        if (data.status) {
            updateData.status = data.status.toLowerCase();
        }
        if (data.requiredCount) {
            updateData.requiredWorkers = data.requiredCount; // Sync
        }
        if (data.genderPreference) {
            updateData.genderPreference = data.genderPreference.toLowerCase();
        }

        // Auto calculate status based on filled count
        if (data.filledCount !== undefined && data.requiredCount !== undefined) {
            if (data.filledCount >= data.requiredCount) {
                updateData.status = 'filled';
            } else if (data.filledCount > 0) {
                updateData.status = 'partial';
            }
        }

        const updated = await prisma.jobOrder.update({
            where: { id },
            data: updateData,
            include: {
                employer: {
                    select: { id: true, companyName: true },
                },
            },
        });

        return {
            ...updated,
            status: updated.status.toUpperCase(),
        };
    },

    /**
     * Soft delete job order
     */
    async deleteJobOrder(id: string) {
        return prisma.jobOrder.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        });
    },

    /**
     * Get counts by status for dashboard
     */
    async getStatusCounts() {
        const counts = await prisma.jobOrder.groupBy({
            by: ['status'],
            where: { isDeleted: false },
            _count: true,
        });

        return counts.reduce((acc, item) => {
            acc[item.status.toUpperCase()] = item._count;
            return acc;
        }, {} as Record<string, number>);
    },
};
