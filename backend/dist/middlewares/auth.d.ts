import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
        }
    }
}
/**
 * Middleware to authenticate requests using JWT.
 * It verifies the token from the Authorization header and attaches the user to the request object.
 */
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Generate JWT token for user
 */
export declare const generateToken: (userId: string, email: string, role: string) => string;
export declare const auth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map