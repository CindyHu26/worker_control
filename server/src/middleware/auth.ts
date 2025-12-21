import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: any;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Debug: Check what token was received
    /*
    console.log('--- Auth Middleware ---');
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('Auth Header:', authHeader);
    console.log('Token:', token); 
    */
    const fs = require('fs');
    const path = require('path');
    const logPath = path.join(process.cwd(), 'auth_debug.log');
    const logData = `[${new Date().toISOString()}] Headers: ${JSON.stringify(req.headers)}\nAuth: ${authHeader}\nToken: ${token}\n\n`;
    try { fs.appendFileSync(logPath, logData); } catch (e) { }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    // Ensure we read the secret fresh every time
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    jwt.verify(token, secret, (err: any, user: any) => {
        if (err) {
            // Debug: Print specific error reason
            console.error('JWT Verify Error:', err.message);

            return res.status(403).json({
                message: 'Forbidden: Invalid token',
                details: err.message
            });
        }
        req.user = user;
        next();
    });
}
