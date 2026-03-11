import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import type { StaffRole } from '../types/index.js';

/** Require a valid JWT access token */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = header.slice(7);
    try {
        req.user = verifyAccessToken(token);
        next();
    } catch {
        res.status(401).json({ error: 'Token invalid or expired' });
    }
}

/** Restrict to specific roles. Must be called after authenticate(). */
export function authorize(...roles: StaffRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
}
