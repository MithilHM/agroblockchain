import { Request, Response } from 'express';
export declare class BatchController {
    registerBatch(req: Request, res: Response): Promise<void>;
    getBatch(req: Request, res: Response): Promise<void>;
    transferBatch(req: Request, res: Response): Promise<void>;
    getUserBatches(req: Request, res: Response): Promise<void>;
    generateOTP(req: Request, res: Response): Promise<void>;
    getPotentialBuyers(req: Request, res: Response): Promise<void>;
}
export declare const batchController: BatchController;
//# sourceMappingURL=batchController.d.ts.map