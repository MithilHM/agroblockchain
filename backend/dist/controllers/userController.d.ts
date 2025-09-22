import { Request, Response } from 'express';
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'farmer' | 'distributor' | 'retailer';
    wallet_address?: string;
    created_at?: string;
    updated_at?: string;
}
export declare class UserController {
    register(req: Request, res: Response): Promise<void>;
    login(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
    updateProfile(req: Request, res: Response): Promise<void>;
}
export declare const userController: UserController;
//# sourceMappingURL=userController.d.ts.map