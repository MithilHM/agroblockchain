import { User } from './User';
import { ProduceBatch } from './ProduceBatch';
export declare enum AuditAction {
    BATCH_CREATED = "batch_created",
    BATCH_TRANSFERRED = "batch_transferred",
    STATUS_UPDATED = "status_updated",
    PRICE_UPDATED = "price_updated",
    FILE_UPLOADED = "file_uploaded",
    USER_LOGIN = "user_login",
    USER_REGISTERED = "user_registered"
}
export declare class AuditLog {
    id: string;
    action: AuditAction;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    user?: User;
    userId?: string;
    batch?: ProduceBatch;
    batchId?: string;
    createdAt: Date;
}
//# sourceMappingURL=Auditlog.d.ts.map