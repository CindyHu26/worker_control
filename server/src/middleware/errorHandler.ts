/**
 * Global Error Handler Middleware
 * Centralizes error handling and provides consistent API error responses
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../types/errors';
import logger, { logError } from '../utils/logger';

/**
 * Standard API Error Response Format
 */
interface ErrorResponse {
    code: string;
    message: string;
    details?: any;
    stack?: string;
}

/**
 * Global Error Handler
 * Must be registered AFTER all routes in app.ts
 */
export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // Log error with context
    logError(err, {
        method: req.method,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    // Zod Validation Errors
    if (err instanceof ZodError) {
        const response: ErrorResponse = {
            code: 'VALIDATION_ERROR',
            message: '資料驗證失敗 (Validation Failed)',
            details: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            }))
        };
        return res.status(400).json(response);
    }

    // Prisma Known Request Errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint violation
        if (err.code === 'P2002') {
            const fields = (err.meta?.target as string[]) || ['field'];
            const field = fields[0];
            const response: ErrorResponse = {
                code: 'DUPLICATE_ENTRY',
                message: `資料重複：${field} 已存在`,
                details: { field, constraint: fields }
            };
            return res.status(409).json(response);
        }

        // P2025: Record not found (delete/update)
        if (err.code === 'P2025') {
            const response: ErrorResponse = {
                code: 'NOT_FOUND',
                message: '找不到指定的資源 (Resource not found)',
                details: { operation: err.meta?.cause }
            };
            return res.status(404).json(response);
        }

        // P2003: Foreign key constraint violation
        if (err.code === 'P2003') {
            const response: ErrorResponse = {
                code: 'FOREIGN_KEY_VIOLATION',
                message: '關聯資料不存在或無法刪除 (Foreign key constraint failed)',
                details: { field: err.meta?.field_name }
            };
            return res.status(409).json(response);
        }

        // P2014: Relation violation (e.g., deleting with existing relations)
        if (err.code === 'P2014') {
            const response: ErrorResponse = {
                code: 'RELATION_VIOLATION',
                message: '無法刪除：存在相關聯的資料',
                details: { relation: err.meta?.relation_name }
            };
            return res.status(409).json(response);
        }

        // Other Prisma errors
        const response: ErrorResponse = {
            code: 'DATABASE_ERROR',
            message: '資料庫操作失敗',
            details: process.env.NODE_ENV === 'development' ? { prismaCode: err.code, meta: err.meta } : undefined
        };
        return res.status(500).json(response);
    }

    // Prisma Validation Errors (e.g., invalid data types)
    if (err instanceof Prisma.PrismaClientValidationError) {
        const response: ErrorResponse = {
            code: 'VALIDATION_ERROR',
            message: '資料格式錯誤',
            details: process.env.NODE_ENV === 'development' ? { error: err.message } : undefined
        };
        return res.status(400).json(response);
    }

    // Custom App Errors
    if (err instanceof AppError) {
        const response: ErrorResponse = {
            code: err.code,
            message: err.message,
            details: err.details
        };
        return res.status(err.statusCode).json(response);
    }

    // Unknown/Unexpected Errors
    const response: ErrorResponse = {
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'production'
            ? '伺服器發生未預期錯誤 (Internal Server Error)'
            : err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    };

    res.status(500).json(response);
};

/**
 * Not Found Handler
 * Catches requests to non-existent routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
        details: {
            method: req.method,
            path: req.path
        }
    });
};
