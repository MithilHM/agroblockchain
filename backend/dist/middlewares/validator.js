"use strict";
// src/middlewares/validator.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
/**
 * Creates a middleware function to validate request data against a Zod schema.
 * @param {AnyZodObject} schema - The Zod schema to validate against.
 */
const validate = (schema) => async (req, res, next) => {
    try {
        await schema.parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        return next();
    }
    catch (error) {
        // The error will be caught and formatted by the global errorHandler
        return next(error);
    }
};
exports.validate = validate;
