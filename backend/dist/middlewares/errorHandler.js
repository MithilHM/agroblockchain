"use strict";
// src/middlewares/errorHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Custom error class for application-specific errors.
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, new.target.prototype); // Restore prototype chain
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
/**
 * Global error handling middleware.
 * Catches all errors and sends a structured JSON response.
 */
const errorHandler = (err, req, res, next) => {
    // Log the error for debugging purposes
    logger_1.logger.error(err);
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid input data',
            errors: err.flatten().fieldErrors,
        });
    }
    // Handle custom application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }
    // Handle other unexpected errors
    const statusCode = 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred.'
        : err.message;
    return res.status(statusCode).json({
        status: 'error',
        message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map