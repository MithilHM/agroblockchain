import { Request, Response } from 'express';
export declare class GeoController {
    addBatchGeolocation(req: Request, res: Response): Promise<void>;
    getBatchLocationHistory(req: Request, res: Response): Promise<void>;
    getBatchesByLocation(req: Request, res: Response): Promise<void>;
    getUserLocationAnalytics(req: Request, res: Response): Promise<void>;
    private calculateDistance;
    private toRad;
    private generateLocationSummary;
}
export declare const geoController: GeoController;
//# sourceMappingURL=geoController.d.ts.map