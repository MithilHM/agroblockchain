// src/middlewares/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware to authenticate requests using JWT.
 * It verifies the token from the Authorization header and attaches the user to the request object.
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication failed: No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET is not defined in environment variables.');
      throw new AppError('Server configuration error.', 500);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Attach user information to the request object
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Authentication failed: Invalid token.', 401));
    }
    next(error);
  }
};