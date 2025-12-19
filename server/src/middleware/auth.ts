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
    // console.log('Checking Token:', token); 

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
