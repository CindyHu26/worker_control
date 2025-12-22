/**
 * Shared Data Transfer Objects (DTOs)
 * This file serves as the single source of truth for API types
 * Used by both backend (validation) and frontend (type safety)
 */

import { z } from 'zod';

// =====================================================
// Enums (Mirror Prisma Enums)
// =====================================================

export const UserRoleSchema = z.enum(['admin', 'manager', 'staff']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const GenderTypeSchema = z.enum(['male', 'female', 'other']);
export type GenderType = z.infer<typeof GenderTypeSchema>;

export const DeploymentStatusSchema = z.enum(['active', 'ended', 'pending', 'terminated']);
export type DeploymentStatus = z.infer<typeof DeploymentStatusSchema>;

export const ServiceStatusSchema = z.enum([
    'active_service',
    'contract_terminated',
    'runaway',
    'transferred_out',
    'commission_ended'
]);
export type ServiceStatus = z.infer<typeof ServiceStatusSchema>;

export const NationalityTypeSchema = z.enum(['PH', 'ID', 'VN', 'TH', 'OTHER']);
export type NationalityType = z.infer<typeof NationalityTypeSchema>;

export const WorkerCategorySchema = z.enum(['general', 'intermediate_skilled', 'professional']);
export type WorkerCategory = z.infer<typeof WorkerCategorySchema>;

export const IncidentSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);
export type IncidentSeverity = z.infer<typeof IncidentSeveritySchema>;

export const IncidentStatusSchema = z.enum(['open', 'in_progress', 'closed']);
export type IncidentStatus = z.infer<typeof IncidentStatusSchema>;

// =====================================================
// Common/Utility Schemas
// =====================================================

/**
 * Standard Pagination Parameters
 */
export const PaginationParamsSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
});
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

/**
 * Standard Paginated Response Metadata
 */
export const PaginationMetaSchema = z.object({
    total: z.number().int(),
    page: z.number().int(),
    limit: z.number().int(),
    totalPages: z.number().int()
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Generic Paginated Response Wrapper
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: z.array(dataSchema),
        meta: PaginationMetaSchema
    });

/**
 * Generic API Response Wrapper
 */
export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
        data: dataSchema
    });

// =====================================================
// Employer DTOs
// =====================================================

/**
 * Factory (Nested in Employer)
 */
export const FactorySchema = z.object({
    id: z.string().uuid().optional(), // Optional for creation
    name: z.string().min(1, '廠名必填'),
    factoryRegNo: z.string().optional(),
    address: z.string().optional(),
    addressEn: z.string().optional(),
    zipCode: z.string().optional(),
    cityCode: z.string().optional(),
    laborCount: z.number().int().min(0).optional(),
    foreignCount: z.number().int().min(0).optional()
});
export type Factory = z.infer<typeof FactorySchema>;

/**
 * Corporate Info (Nested in Employer)
 */
export const CorporateInfoSchema = z.object({
    factoryRegistrationNo: z.string().optional(),
    factoryRegistrationId: z.string().optional(),
    factoryAddress: z.string().optional(),
    factoryAddressEn: z.string().optional(),
    industryType: z.string().optional(), // MANUFACTURING, INSTITUTION
    industryCode: z.string().optional(),
    capital: z.number().optional(),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(),
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(),
    faxNumber: z.string().optional(),
    institutionCode: z.string().optional(),
    bedCount: z.number().int().optional()
});
export type CorporateInfo = z.infer<typeof CorporateInfoSchema>;

/**
 * Individual Info (Nested in Employer)
 */
export const IndividualInfoSchema = z.object({
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().datetime().or(z.date()).optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    englishName: z.string().optional(),
    birthPlace: z.string().optional(),
    birthPlaceEn: z.string().optional(),
    residenceAddress: z.string().optional(),
    residenceZip: z.string().optional(),
    residenceCityCode: z.string().optional(),
    idIssueDate: z.string().datetime().or(z.date()).optional(),
    idIssuePlace: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional()
});
export type IndividualInfo = z.infer<typeof IndividualInfoSchema>;

/**
 * Industry Recognition (3K5 核定)
 */
export const IndustryRecognitionSchema = z.object({
    id: z.string().uuid(),
    bureauRefNumber: z.string(), // 工業局函號
    issueDate: z.string().datetime().or(z.date()),
    tier: z.string(), // A+, A, B, C, D
    expiryDate: z.string().datetime().or(z.date()).nullable(),
    allocationRate: z.number().nullable(), // 配額比率 (e.g., 0.20 for B級)
    approvedQuota: z.number().int(),
    usedQuota: z.number().int(),
    fileUrl: z.string().url().nullable()
});
export type IndustryRecognition = z.infer<typeof IndustryRecognitionSchema>;

/**
 * Recruitment Letter
 */
export const RecruitmentLetterSchema = z.object({
    id: z.string().uuid(),
    letterNumber: z.string(),
    issueDate: z.string().datetime().or(z.date()),
    expiryDate: z.string().datetime().or(z.date()),
    approvedQuota: z.number().int(),
    usedQuota: z.number().int(),
    quotaMale: z.number().int().optional(),
    quotaFemale: z.number().int().optional(),
    canCirculate: z.boolean(),
    workAddress: z.string().nullable(),
    jobType: z.string().nullable(),
    nationality: z.string().nullable(),
    tier: z.string().nullable(), // Industry tier from linked IndustryRecognition
    remarks: z.string().nullable()
});
export type RecruitmentLetter = z.infer<typeof RecruitmentLetterSchema>;

/**
 * Employer Response (GET /api/employers/:id)
 */
export const EmployerResponseSchema = z.object({
    id: z.string().uuid(),
    code: z.string().nullable(),
    shortName: z.string().nullable(),
    taxId: z.string().nullable(),
    companyName: z.string(),
    companyNameEn: z.string().nullable(),
    responsiblePerson: z.string().nullable(),
    address: z.string().nullable(),
    addressEn: z.string().nullable(),
    invoiceAddress: z.string().nullable(),
    taxAddress: z.string().nullable(),
    healthBillAddress: z.string().nullable(),
    healthBillZip: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    email: z.string().nullable(),
    contactPerson: z.string().nullable(),
    contactPhone: z.string().nullable(),
    referrer: z.string().nullable(),
    allocationRate: z.number().nullable(),
    complianceStandard: z.string().nullable(),
    zeroFeeEffectiveDate: z.string().datetime().or(z.date()).nullable(),

    // Nested relations
    corporateInfo: CorporateInfoSchema.nullable(),
    individualInfo: IndividualInfoSchema.nullable(),
    factories: z.array(FactorySchema).optional(),
    recruitmentLetters: z.array(RecruitmentLetterSchema).optional(),
    industryRecognitions: z.array(IndustryRecognitionSchema).optional(),

    // Counts
    _count: z.object({
        deployments: z.number().int()
    }).optional(),

    // Summary (from service)
    summary: z.any().optional(), // TODO: Define summary schema

    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});
export type EmployerResponse = z.infer<typeof EmployerResponseSchema>;

/**
 * Employer List Item (GET /api/employers)
 */
export const EmployerListItemSchema = z.object({
    id: z.string().uuid(),
    code: z.string().nullable(),
    shortName: z.string().nullable(),
    companyName: z.string(),
    taxId: z.string().nullable(),
    responsiblePerson: z.string().nullable(),
    phoneNumber: z.string().nullable(),
    address: z.string().nullable(),
    email: z.string().nullable(),
    _count: z.object({
        deployments: z.number().int()
    }).optional(),
    homeCareInfo: z.object({
        patients: z.array(z.object({
            name: z.string(),
            careAddress: z.string()
        }))
    }).optional(),
    institutionInfo: z.object({
        institutionCode: z.string().nullable(),
        bedCount: z.number().int().nullable()
    }).optional(),
    createdAt: z.string().datetime()
});
export type EmployerListItem = z.infer<typeof EmployerListItemSchema>;

/**
 * Create Employer Input (POST /api/employers)
 */
export const CreateEmployerInputSchema = z.object({
    // Basic Info
    companyName: z.string().min(1, 'Company name is required'),
    companyNameEn: z.string().optional(),
    code: z.string().optional(),
    shortName: z.string().optional(),
    taxId: z.string().optional(),
    responsiblePerson: z.string().optional(),

    // Contact
    phoneNumber: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    contactPerson: z.string().optional(),
    contactPhone: z.string().optional(),

    // Addresses
    address: z.string().optional(),
    addressEn: z.string().optional(),
    invoiceAddress: z.string().optional(),
    taxAddress: z.string().optional(),
    healthBillAddress: z.string().optional(),
    healthBillZip: z.string().optional(),

    // Management
    referrer: z.string().optional(),
    allocationRate: z.union([z.string(), z.number()]).optional(),
    complianceStandard: z.string().optional(),
    zeroFeeEffectiveDate: z.string().optional(),

    // Corporate Fields
    category: z.string().optional(),
    isCorporate: z.boolean().optional(),
    factoryRegistrationNo: z.string().optional(),
    industryType: z.string().optional(),
    industryCode: z.string().optional(),
    factoryAddress: z.string().optional(),
    capital: z.coerce.number().optional(),
    laborInsuranceNo: z.string().optional(),
    laborInsuranceId: z.string().optional(),
    healthInsuranceUnitNo: z.string().optional(),
    healthInsuranceId: z.string().optional(),
    institutionCode: z.string().optional(),
    bedCount: z.coerce.number().int().optional(),
    avgDomesticWorkers: z.coerce.number().int().optional(),

    // Individual Fields
    responsiblePersonIdNo: z.string().optional(),
    responsiblePersonDob: z.string().optional(),
    responsiblePersonSpouse: z.string().optional(),
    responsiblePersonFather: z.string().optional(),
    responsiblePersonMother: z.string().optional(),
    englishName: z.string().optional(),
    birthPlace: z.string().optional(),
    birthPlaceEn: z.string().optional(),
    residenceAddress: z.string().optional(),
    residenceZip: z.string().optional(),
    residenceCityCode: z.string().optional(),
    militaryStatus: z.string().optional(),
    militaryStatusEn: z.string().optional(),
    idIssueDate: z.string().optional(),
    idIssuePlace: z.string().optional(),

    // Home Care
    patientName: z.string().optional(),
    patientIdNo: z.string().optional(),
    careAddress: z.string().optional(),
    relationship: z.string().optional(),

    // Factories
    factories: z.array(FactorySchema).optional(),

    // Initial Recruitment Letters
    initialRecruitmentLetters: z.array(z.object({
        letterNumber: z.string().min(1, '函文號必填'),
        issueDate: z.coerce.date(),
        expiryDate: z.coerce.date(),
        approvedQuota: z.coerce.number().int().min(1, '核准名額必須大於0')
    })).optional()
});
export type CreateEmployerInput = z.infer<typeof CreateEmployerInputSchema>;

// =====================================================
// Worker DTOs
// =====================================================

/**
 * Worker Response
 */
export const WorkerResponseSchema = z.object({
    id: z.string().uuid(),
    englishName: z.string(),
    chineseName: z.string().nullable(),
    dob: z.string().datetime().or(z.date()),
    nationality: NationalityTypeSchema,
    category: WorkerCategorySchema,
    gender: GenderTypeSchema.nullable(),
    mobilePhone: z.string().nullable(),
    foreignAddress: z.string().nullable(),
    maritalStatus: z.string().nullable(),
    height: z.number().nullable(),
    weight: z.number().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});
export type WorkerResponse = z.infer<typeof WorkerResponseSchema>;

// =====================================================
// Deployment DTOs
// =====================================================

/**
 * Create Deployment Input (POST /api/deployments)
 */
export const CreateDeploymentInputSchema = z.object({
    workerId: z.string().uuid('Invalid worker ID'),
    employerId: z.string().uuid('Invalid employer ID'),
    recruitmentLetterId: z.string().uuid().optional(),
    factoryId: z.string().uuid().optional(),
    startDate: z.string().datetime().or(z.coerce.date()),
    jobType: z.string().optional()
});
export type CreateDeploymentInput = z.infer<typeof CreateDeploymentInputSchema>;

/**
 * Deployment Response
 */
export const DeploymentResponseSchema = z.object({
    id: z.string().uuid(),
    workerId: z.string().uuid(),
    employerId: z.string().uuid(),
    recruitmentLetterId: z.string().uuid().nullable(),
    factoryId: z.string().uuid().nullable(),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()).nullable(),
    status: DeploymentStatusSchema,
    serviceStatus: ServiceStatusSchema,
    jobType: z.string().nullable(),
    entryDate: z.string().datetime().or(z.date()).nullable(),
    flightNumber: z.string().nullable(),
    flightArrivalDate: z.string().datetime().or(z.date()).nullable(),
    terminationReason: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});
export type DeploymentResponse = z.infer<typeof DeploymentResponseSchema>;

// =====================================================
// Incident DTOs
// =====================================================

export const IncidentResponseSchema = z.object({
    id: z.string().uuid(),
    workerId: z.string().uuid().nullable(),
    employerId: z.string().uuid().nullable(),
    description: z.string(),
    severityLevel: IncidentSeveritySchema,
    status: IncidentStatusSchema,
    category: z.string().nullable(),
    incidentDate: z.string().datetime(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime()
});
export type IncidentResponse = z.infer<typeof IncidentResponseSchema>;

// =====================================================
// Search/Filter DTOs
// =====================================================

/**
 * Employer Search Params (GET /api/employers)
 */
export const EmployerSearchParamsSchema = PaginationParamsSchema.extend({
    q: z.string().optional(), // Keyword search
    type: z.enum(['corporate', 'individual']).optional(),
    category: z.enum(['ALL', 'MANUFACTURING', 'HOME_CARE', 'INSTITUTION']).optional()
});
export type EmployerSearchParams = z.infer<typeof EmployerSearchParamsSchema>;
