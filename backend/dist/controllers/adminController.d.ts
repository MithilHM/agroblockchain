import { Request, Response } from 'express';
export declare class AdminController {
    getAllUsers(req: Request, res: Response): Promise<void>;
    getSystemStats(req: Request, res: Response): Promise<void>;
    updateUserStatus(req: Request, res: Response): Promise<void>;
    getAuditLogs(req: Request, res: Response): Promise<void>;
    verifyBatch(req: Request, res: Response): Promise<void>;
}
export declare const adminController: AdminController;
//# sourceMappingURL=adminController.d.ts.map