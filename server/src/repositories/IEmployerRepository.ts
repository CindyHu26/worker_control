import type { Employer, Prisma } from '@prisma/client';

/**
 * Search parameters for employer queries
 */
export interface EmployerSearchParams {
    q?: string;
    type?: 'corporate' | 'individual';
    category?: string;
    page?: number;
    limit?: number;
}

/**
 * Employer with full relations
 */
export type EmployerWithRelations = Employer & {
    corporateInfo?: any;
    individualInfo?: any;
    factories?: any[];
    recruitmentLetters?: any[];
    industryRecognitions?: any[];
    category?: any;
    deployments?: any[];
};

/**
 * Employer Repository Interface
 * Abstracts data access for Employer entity
 */
export interface IEmployerRepository {
    /**
     * Create a new employer
     */
    create(data: Prisma.EmployerCreateInput): Promise<Employer>;

    /**
     * Find employer by ID with optional relations
     */
    findById(id: string, includeRelations?: boolean): Promise<EmployerWithRelations | null>;

    /**
     * Find employer by Tax ID
     */
    findByTaxId(taxId: string): Promise<Employer | null>;

    /**
     * Search employers with pagination
     */
    findMany(params: EmployerSearchParams): Promise<EmployerWithRelations[]>;

    /**
     * Count employers matching search criteria
     */
    count(params: EmployerSearchParams): Promise<number>;

    /**
     * Update employer by ID
     */
    update(id: string, data: Prisma.EmployerUpdateInput): Promise<Employer>;

    /**
     * Delete employer by ID
     */
    delete(id: string): Promise<void>;

    /**
     * Check if employer exists by ID
     */
    exists(id: string): Promise<boolean>;

    /**
     * Get employer summary statistics
     */
    getSummary(id: string): Promise<any>;
}
