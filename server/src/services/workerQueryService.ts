import prisma from '../prisma';
import { storageService } from './storageService';
import { parseNumber } from '../utils/numberUtils';

export interface WorkerSearchParams {
    q?: string;
    status?: 'active' | 'inactive';
    nationality?: string;
    filter?: 'expiring_30' | 'arriving_week' | 'missing_docs';
    page?: string | number;
    limit?: string | number;
}

export interface PaginatedWorkerResponse {
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Build Prisma where clause from search parameters
 */
export function buildWorkerFilters(params: WorkerSearchParams) {
    const whereClause: any = {};
    const andConditions: any[] = [];

    // 1. Keyword Search (Name, Passport, ARC)
    if (params.q) {
        const keyword = params.q;
        andConditions.push({
            OR: [
                { englishName: { contains: keyword } },
                { chineseName: { contains: keyword } },
                {
                    passports: {
                        some: { passportNumber: { contains: keyword } }
                    }
                },
                {
                    arcs: {
                        some: { arcNumber: { contains: keyword } }
                    }
                },
                { oldPassportNumber: { contains: keyword } }
            ]
        });
    }

    // 2. Exact Filters
    if (params.nationality) {
        andConditions.push({ nationality: params.nationality });
    }

    // 3. Status Logic
    if (params.status) {
        if (params.status === 'active') {
            andConditions.push({
                deployments: {
                    some: { status: 'active' }
                }
            });
        } else if (params.status === 'inactive') {
            andConditions.push({
                deployments: {
                    none: { status: 'active' }
                }
            });
        }
    }

    // 4. Quick Filters
    if (params.filter) {
        const now = new Date();
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        if (params.filter === 'expiring_30') {
            andConditions.push({
                deployments: {
                    some: {
                        status: 'active',
                        endDate: {
                            gte: now,
                            lte: in30Days
                        }
                    }
                }
            });
        } else if (params.filter === 'arriving_week') {
            andConditions.push({
                deployments: {
                    some: {
                        status: { in: ['active', 'pending'] },
                        flightArrivalDate: {
                            gte: now,
                            lte: nextWeek
                        }
                    }
                }
            });
        } else if (params.filter === 'missing_docs') {
            andConditions.push({
                OR: [
                    {
                        passports: {
                            none: { isCurrent: true }
                        }
                    },
                    {
                        arcs: {
                            none: { isCurrent: true }
                        }
                    }
                ]
            });
        }
    }

    if (andConditions.length > 0) {
        whereClause.AND = andConditions;
    }

    return whereClause;
}

/**
 * Transform worker photo URLs to presigned URLs
 */
export async function transformWorkerPhotoUrl(worker: any): Promise<any> {
    if (worker.photoUrl && !worker.photoUrl.startsWith('/uploads/')) {
        try {
            const presigned = await storageService.getPresignedUrl(worker.photoUrl);
            return { ...worker, photoUrl: presigned };
        } catch (e) {
            console.error('Failed to presign url for worker', worker.id, e);
            return worker;
        }
    }
    return worker;
}

/**
 * Search workers with pagination
 */
export async function searchWorkers(params: WorkerSearchParams): Promise<PaginatedWorkerResponse> {
    const pageNum = parseNumber(params.page) || 1;
    const limitNum = parseNumber(params.limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const whereClause = buildWorkerFilters(params);

    const [total, workers] = await Promise.all([
        prisma.worker.count({ where: whereClause }),
        prisma.worker.findMany({
            where: whereClause,
            include: {
                deployments: {
                    where: { status: 'active' },
                    take: 1,
                    include: { employer: { select: { companyName: true } } }
                },
                passports: {
                    where: { isCurrent: true },
                    take: 1
                }
            },
            skip,
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        })
    ]);

    // Transform photo URLs
    const workersWithPhoto = await Promise.all(
        workers.map(worker => transformWorkerPhotoUrl(worker))
    );

    return {
        data: workersWithPhoto,
        meta: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    };
}

/**
 * Get worker by ID with all relations
 */
export async function getWorkerById(id: string) {
    const worker = await prisma.worker.findUnique({
        where: { id },
        include: {
            passports: { orderBy: { issueDate: 'desc' } },
            arcs: { orderBy: { issueDate: 'desc' } },
            deployments: {
                include: {
                    employer: true,
                    permitDetails: {
                        include: {
                            permitDocument: true
                        }
                    },
                },
                orderBy: { startDate: 'desc' }
            },
            incidents: {
                orderBy: { incidentDate: 'desc' }
            },
            addressHistory: { orderBy: { startDate: 'desc' } },
            insurances: { orderBy: { startDate: 'desc' } },
            healthChecks: { orderBy: { checkDate: 'desc' } },
            serviceAssignments: {
                where: { endDate: null },
                include: { internalUser: true }
            }
        }
    });

    if (!worker) {
        return null;
    }

    // Transform photo URL
    return await transformWorkerPhotoUrl(worker);
}
