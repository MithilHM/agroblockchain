import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
/**
 * Creates a middleware function to validate request data against a Zod schema.
 * @param {AnyZodObject} schema - The Zod schema to validate against.
 */
export declare const validate: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validator.d.ts.map