"use strict";
// src/middlewares/role.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLES = exports.authorize = void 0;
/**
 * Creates a middleware function to authorize users based on their roles.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
const authorize = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should theoretically not be reached if `authenticate` runs first
            return next(new errorHandler_1.AppError('Authentication required.', 401));
        }
        const { role } = req.user;
        if (!allowedRoles.includes(role)) {
            return next(new errorHandler_1.AppError('Forbidden: You do not have permission to perform this action.', 403));
        }
        next();
    };
};
exports.authorize = authorize;
// You can also define specific role constants for consistency
exports.ROLES = {
    FARMER: 'FARMER',
    DISTRIBUTOR: 'DISTRIBUTOR',
    RETAILER: 'RETAILER',
    CONSUMER: 'CONSUMER',
    REGULATOR: 'REGULATOR',
    ADMIN: 'ADMIN',
};
