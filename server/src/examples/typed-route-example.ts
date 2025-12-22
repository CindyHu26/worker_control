/**
 * Example: Using Shared DTOs in Routes
 * This demonstrates how to refactor a route using the new type system
 */

import { Router } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import {
    CreateEmployerInputSchema,
    EmployerResponseSchema,
    EmployerListItemSchema,
    EmployerSearchParamsSchema,
    createPaginatedResponseSchema,
    createApiResponseSchema,
    type CreateEmployerInput,
    type EmployerResponse,
    type EmployerListItem
} from '../types/dtos';
import { ValidationError, DuplicateResourceError } from '../types/errors';

const router = Router();

/**
 * EXAMPLE 1: GET /api/employers (List with Pagination)
 * Uses EmployerSearchParamsSchema for validation
 */
router.get('/', async (req, res, next) => {
    try {
        // Validate query parameters
        const params = EmployerSearchParamsSchema.parse(req.query);

        const { q, page, limit, type, category } = params;
        const skip = (page - 1) * limit;

        const whereClause: any = {};

        // Category filter
        if (category && category !== 'ALL') {
            if (category === 'MANUFACTURING') {
                whereClause.corporateInfo = { industryType: 'MANUFACTURING' };
            } else if (category === 'HOME_CARE') {
                whereClause.individualInfo = { isNot: null };
            } else if (category === 'INSTITUTION') {
                whereClause.corporateInfo = { industryType: 'INSTITUTION' };
            }
        }

        // Type filter
        if (type === 'corporate') {
            whereClause.corporateInfo = { isNot: null };
        } else if (type === 'individual') {
            whereClause.individualInfo = { isNot: null };
        }

        // Keyword search
        if (q) {
            whereClause.OR = [
                { companyName: { contains: q, mode: 'insensitive' } },
                { taxId: { contains: q } },
                { code: { contains: q } }
            ];
        }

        const [total, employers] = await Promise.all([
            prisma.employer.count({ where: whereClause }),
            prisma.employer.findMany({
                where: whereClause,
                include: {
                    corporateInfo: true,
                    individualInfo: true,
                    _count: {
                        select: { deployments: { where: { status: 'active' } } }
                    }
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Map to EmployerListItem type
        const data: EmployerListItem[] = employers.map(emp => ({
            id: emp.id,
            code: emp.code,
            shortName: emp.shortName,
            companyName: emp.companyName || emp.responsiblePerson || '未命名',
            taxId: emp.taxId,
            responsiblePerson: emp.responsiblePerson,
            phoneNumber: emp.phoneNumber,
            address: emp.address,
            email: emp.email,
            _count: emp._count,
            homeCareInfo: emp.individualInfo ? {
                patients: [{
                    name: emp.individualInfo.patientName || '',
                    careAddress: emp.individualInfo.careAddress || ''
                }]
            } : undefined,
            institutionInfo: emp.corporateInfo ? {
                institutionCode: emp.corporateInfo.institutionCode,
                bedCount: emp.corporateInfo.bedCount
            } : undefined,
            createdAt: emp.createdAt.toISOString()
        }));

        // Return typed response
        res.json({
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        next(error); // Global error handler
    }
});

/**
 * EXAMPLE 2: POST /api/employers (Create)
 * Uses CreateEmployerInputSchema for validation
 */
router.post('/', async (req, res, next) => {
    try {
        // Validate request body (Zod will throw ZodError if invalid)
        const input: CreateEmployerInput = CreateEmployerInputSchema.parse(req.body);

        // Check for duplicates
        if (input.taxId) {
            const existing = await prisma.employer.findUnique({
                where: { taxId: input.taxId }
            });
            if (existing) {
                throw new DuplicateResourceError('taxId', input.taxId);
            }
        }

        if (input.code) {
            const existing = await prisma.employer.findUnique({
                where: { code: input.code }
            });
            if (existing) {
                throw new DuplicateResourceError('code', input.code);
            }
        }

        // Determine employer type
        const isCorporate = !!(
            input.factoryRegistrationNo ||
            input.industryType ||
            input.category ||
            (input.taxId && input.taxId.length === 8)
        );

        // Create employer in transaction
        const newEmployer = await prisma.$transaction(async (tx) => {
            const data: any = {
                companyName: input.companyName,
                companyNameEn: input.companyNameEn,
                taxId: input.taxId,
                code: input.code,
                shortName: input.shortName,
                responsiblePerson: input.responsiblePerson,
                phoneNumber: input.phoneNumber,
                address: input.address,
                email: input.email,
                allocationRate: input.allocationRate ? Number(input.allocationRate) : undefined,
                complianceStandard: input.complianceStandard || 'NONE'
            };

            if (isCorporate) {
                data.corporateInfo = {
                    create: {
                        factoryRegistrationNo: input.factoryRegistrationNo,
                        industryType: input.industryType,
                        capital: input.capital,
                        laborInsuranceNo: input.laborInsuranceNo
                    }
                };
            }

            if (input.factories && input.factories.length > 0) {
                data.factories = {
                    create: input.factories.map(f => ({
                        name: f.name,
                        factoryRegNo: f.factoryRegNo,
                        address: f.address,
                        laborCount: f.laborCount,
                        foreignCount: f.foreignCount
                    }))
                };
            }

            return await tx.employer.create({
                data,
                include: {
                    corporateInfo: true,
                    individualInfo: true,
                    factories: true
                }
            });
        });

        // Return typed response
        res.status(201).json({
            data: {
                id: newEmployer.id,
                code: newEmployer.code,
                companyName: newEmployer.companyName,
                taxId: newEmployer.taxId,
                createdAt: newEmployer.createdAt.toISOString(),
                updatedAt: newEmployer.updatedAt.toISOString()
                // ... map other fields
            }
        });

    } catch (error) {
        next(error);
    }
});

/**
 * EXAMPLE 3: GET /api/employers/:id (Detail)
 * Returns EmployerResponse type
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const employer = await prisma.employer.findUnique({
            where: { id },
            include: {
                corporateInfo: true,
                individualInfo: true,
                factories: true,
                recruitmentLetters: {
                    orderBy: { issueDate: 'desc' }
                },
                industryRecognitions: {
                    orderBy: { issueDate: 'desc' }
                },
                _count: {
                    select: { deployments: { where: { status: 'active' } } }
                }
            }
        });

        if (!employer) {
            return res.status(404).json({
                code: 'NOT_FOUND',
                message: 'Employer not found'
            });
        }

        // Map to EmployerResponse type
        const response: EmployerResponse = {
            id: employer.id,
            code: employer.code,
            shortName: employer.shortName,
            taxId: employer.taxId,
            companyName: employer.companyName,
            companyNameEn: employer.companyNameEn,
            responsiblePerson: employer.responsiblePerson,
            address: employer.address,
            addressEn: employer.addressEn,
            invoiceAddress: employer.invoiceAddress,
            taxAddress: employer.taxAddress,
            healthBillAddress: employer.healthBillAddress,
            healthBillZip: employer.healthBillZip,
            phoneNumber: employer.phoneNumber,
            email: employer.email,
            contactPerson: employer.contactPerson,
            contactPhone: employer.contactPhone,
            referrer: employer.referrer,
            allocationRate: employer.allocationRate ? Number(employer.allocationRate) : null,
            complianceStandard: employer.complianceStandard,
            zeroFeeEffectiveDate: employer.zeroFeeEffectiveDate?.toISOString() || null,
            corporateInfo: employer.corporateInfo ? {
                factoryRegistrationNo: employer.corporateInfo.factoryRegistrationNo,
                industryType: employer.corporateInfo.industryType,
                capital: employer.corporateInfo.capital ? Number(employer.corporateInfo.capital) : undefined,
                // ... map other fields
            } : null,
            individualInfo: employer.individualInfo ? {
                responsiblePersonIdNo: employer.individualInfo.responsiblePersonIdNo,
                patientName: employer.individualInfo.patientName,
                // ... map other fields
            } : null,
            factories: employer.factories.map(f => ({
                id: f.id,
                name: f.name,
                factoryRegNo: f.factoryRegNo,
                address: f.address,
                laborCount: f.laborCount || undefined,
                foreignCount: f.foreignCount || undefined
            })),
            recruitmentLetters: employer.recruitmentLetters.map(rl => ({
                id: rl.id,
                letterNumber: rl.letterNumber,
                issueDate: rl.issueDate.toISOString(),
                expiryDate: rl.expiryDate.toISOString(),
                approvedQuota: rl.approvedQuota,
                usedQuota: rl.usedQuota,
                canCirculate: rl.canCirculate,
                workAddress: rl.workAddress,
                jobType: rl.jobType,
                nationality: rl.nationality,
                tier: rl.industryTier,
                remarks: rl.remarks
            })),
            industryRecognitions: employer.industryRecognitions?.map(ir => ({
                id: ir.id,
                bureauRefNumber: ir.bureauRefNumber,
                issueDate: ir.issueDate.toISOString(),
                tier: ir.tier,
                expiryDate: ir.expiryDate?.toISOString() || null,
                allocationRate: ir.allocationRate ? Number(ir.allocationRate) : null,
                approvedQuota: ir.approvedQuota,
                usedQuota: ir.usedQuota,
                fileUrl: ir.fileUrl
            })),
            _count: employer._count,
            createdAt: employer.createdAt.toISOString(),
            updatedAt: employer.updatedAt.toISOString()
        };

        // Validate response matches schema (optional, for dev)
        if (process.env.NODE_ENV === 'development') {
            EmployerResponseSchema.parse(response);
        }

        res.json({ data: response });

    } catch (error) {
        next(error);
    }
});

export default router;
