// src/middlewares/validator.ts

import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Creates a middleware function to validate request data against a Zod schema.
 * @param {AnyZodObject} schema - The Zod schema to validate against.
 */
export const validate =
  (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      // The error will be caught and formatted by the global errorHandler
      return next(error);
    }
  };