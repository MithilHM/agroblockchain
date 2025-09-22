import { User } from './User';
import { AuditLog } from './AuditLog';
export declare enum BatchStatus {
    HARVESTED = "harvested",
    IN_TRANSIT = "in_transit",
    WITH_DISTRIBUTOR = "with_distributor",
    WITH_RETAILER = "with_retailer",
    SOLD = "sold",
    EXPIRED = "expired"
}
export declare class ProduceBatch {
    id: string;
    batchId: string;
    produceType: string;
    origin: string;
    status: BatchStatus;
    currentPrice: number;
    quantity: number;
    unit: string;
    description?: string;
    certifications?: any;
    qrCodeUrl?: string;
    images?: string[];
    geolocation?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    harvestDate?: Date;
    expiryDate?: Date;
    currentOwner: User;
    currentOwnerId: string;
    originalFarmerId: string;
    transferHistory: string[];
    auditLogs: AuditLog[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=ProduceBatch.d.ts.map