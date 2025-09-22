import { Request, Response, NextFunction } from 'express';
/**
 * Custom error class for application-specific errors.
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code.
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    constructor(message: string, statusCode: number);
}
/**
 * Global error handling middleware.
 * Catches all errors and sends a structured JSON response.
 */
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map