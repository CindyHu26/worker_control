/**
 * Custom Error Classes for Worker Control System
 * Provides semantic error types with consistent HTTP status codes
 */

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (400)
 * Used when input data fails validation (Zod, custom validators)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/**
 * Resource Not Found Error (404)
 * Used when a requested resource doesn't exist
 */
export class ResourceNotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super('NOT_FOUND', message, 404);
  }
}

/**
 * Duplicate Resource Error (409)
 * Used when attempting to create a resource that already exists
 */
export class DuplicateResourceError extends AppError {
  constructor(field: string, value: string) {
    super('DUPLICATE_ENTRY', `${field} '${value}' already exists`, 409, { field, value });
  }
}

/**
 * Quota Exceeded Error (409)
 * Used when recruitment letter quota is exhausted
 */
export class QuotaExceededError extends AppError {
  constructor(message: string, details?: any) {
    super('QUOTA_EXCEEDED', message, 409, details);
  }
}

/**
 * Business Rule Violation Error (422)
 * Used when operation violates business logic constraints
 */
export class BusinessRuleError extends AppError {
  constructor(message: string, details?: any) {
    super('BUSINESS_RULE_VIOLATION', message, 422, details);
  }
}

/**
 * Authorization Error (403)
 * Used when user lacks permission for an operation
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super('FORBIDDEN', message, 403);
  }
}

/**
 * Authentication Error (401)
 * Used when authentication is required or has failed
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super('UNAUTHORIZED', message, 401);
  }
}
