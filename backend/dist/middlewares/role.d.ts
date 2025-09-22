import { Request, Response, NextFunction } from 'express';
/**
 * Creates a middleware function to authorize users based on their roles.
 * @param {string[]} allowedRoles - An array of roles that are allowed to access the route.
 */
export declare const authorize: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const ROLES: {
    FARMER: string;
    DISTRIBUTOR: string;
    RETAILER: string;
    CONSUMER: string;
    REGULATOR: string;
    ADMIN: string;
};
//# sourceMappingURL=role.d.ts.map