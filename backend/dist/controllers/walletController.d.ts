import { Request, Response } from 'express';
export declare class WalletController {
    getWalletDetails(req: Request, res: Response): Promise<void>;
    getTransactionHistory(req: Request, res: Response): Promise<void>;
    updateWalletAddress(req: Request, res: Response): Promise<void>;
    getEarningsSummary(req: Request, res: Response): Promise<void>;
}
export declare const walletController: WalletController;
//# sourceMappingURL=walletController.d.ts.map