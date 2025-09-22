import { ProduceBatch } from './ProduceBatch';
export declare enum UserRole {
    FARMER = "farmer",
    DISTRIBUTOR = "distributor",
    RETAILER = "retailer",
    REGULATOR = "regulator",
    ADMIN = "admin"
}
export declare enum UserStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export declare class User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    phone?: string;
    address?: string;
    walletAddress?: string;
    kycDocuments?: any;
    isVerified: boolean;
    batches: ProduceBatch[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map