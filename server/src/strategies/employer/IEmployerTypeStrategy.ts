import type { Prisma } from '@prisma/client';

/**
 * Validation result from strategy
 */
export interface ValidationResult {
    isValid: boolean;
    errors?: string[];
}

/**
 * Employer Type Strategy Interface
 * Defines type-specific behavior for different employer categories
 */
export interface IEmployerTypeStrategy {
    /**
     * Get the category code this strategy handles
     */
    getCategory(): string;

    /**
     * Validate employer-specific data
     */
    validate(data: any): ValidationResult;

    /**
     * Prepare data for employer creation
     * Transforms input into Prisma create format with type-specific nested relations
     */
    prepareCreateData(input: any): Prisma.EmployerCreateInput;

    /**
     * Prepare data for employer update
     * Transforms input into Prisma update format
     */
    prepareUpdateData(input: any): Prisma.EmployerUpdateInput;
}
