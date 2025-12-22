/**
 * Production-Grade Logger
 * Uses Winston with daily rotating file transport
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'info';
};

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Console transport
const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
            (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
        ),
    ),
});

// File transport for all logs (daily rotation)
const fileTransport = new DailyRotateFile({
    filename: path.join('logs', 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json(),
    ),
});

// File transport for errors only
const errorFileTransport = new DailyRotateFile({
    filename: path.join('logs', 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d', // Keep error logs for 30 days
    level: 'error',
    format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.timestamp(),
        winston.format.json(),
    ),
});

// Create logger instance
const logger = winston.createLogger({
    level: level(),
    levels,
    transports: [
        consoleTransport,
        fileTransport,
        errorFileTransport,
    ],
});

/**
 * Helper function to log with context
 */
export function logWithContext(level: string, message: string, meta?: any) {
    logger.log(level, message, meta);
}

/**
 * Audit logging for critical operations
 */
export function auditLog(operation: string, userId: string | undefined, details: any) {
    logger.info(`[AUDIT] ${operation}`, {
        userId,
        timestamp: new Date().toISOString(),
        ...details,
    });
}

/**
 * Error logging with stack trace
 */
export function logError(error: Error, context?: any) {
    logger.error(error.message, {
        stack: error.stack,
        context,
    });
}

/**
 * HTTP request logging
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number) {
    logger.http(`${method} ${url} ${statusCode} - ${duration}ms`);
}

export default logger;
