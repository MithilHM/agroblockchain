// src/middlewares/role.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

/**
 * Creates a middleware function to authorize users based on their roles.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // This should theoretically not be reached if `authenticate` runs first
      return next(new AppError('Authentication required.', 401));
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return next(
        new AppError('Forbidden: You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};

// You can also define specific role constants for consistency
export const ROLES = {
  FARMER: 'FARMER',
  DISTRIBUTOR: 'DISTRIBUTOR',
  RETAILER: 'RETAILER',
  CONSUMER: 'CONSUMER',
  REGULATOR: 'REGULATOR',
  ADMIN: 'ADMIN',
};