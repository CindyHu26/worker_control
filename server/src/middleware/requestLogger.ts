/**
 * HTTP Request Logger Middleware
 * Logs all incoming HTTP requests with method, URL, status code, and response time
 */

import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../utils/logger';

/**
 * HTTP Request Logging Middleware
 * Use this in app.ts before routes
 */
export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture response finish event
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logRequest(req.method, req.url, res.statusCode, duration);
    });

    next();
}

export default requestLoggerMiddleware;
