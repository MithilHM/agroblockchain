import { Request, Response } from 'express';
export declare class DistributorController {
    getAvailableDistributors(req: Request, res: Response): Promise<void>;
    createBatchOffer(req: Request, res: Response): Promise<void>;
    getDistributorOffers(req: Request, res: Response): Promise<void>;
    respondToOffer(req: Request, res: Response): Promise<void>;
    getInventoryAnalytics(req: Request, res: Response): Promise<void>;
    private extractDistributorSpecialties;
    private calculateInventoryAnalytics;
}
export declare const distributorController: DistributorController;
//# sourceMappingURL=distributorController.d.ts.map