import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
}

export function errorHandler(
    err: AppError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction
): void {
    const statusCode = err.statusCode ?? 500;
    const message = err.message ?? 'Internal Server Error';

    if (statusCode >= 500) {
        console.error(`[ERROR] ${req.method} ${req.path}:`, err);
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
}

/** Create a typed HTTP error quickly */
export function createError(message: string, statusCode = 500): AppError {
    const err: AppError = new Error(message);
    err.statusCode = statusCode;
    return err;
}
