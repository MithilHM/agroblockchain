import { Request, Response } from 'express';
interface Notification {
    id?: string;
    user_id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    batch_id?: string;
    read: boolean;
    created_at?: string;
}
export declare class NotificationController {
    getUserNotifications(req: Request, res: Response): Promise<void>;
    markAsRead(req: Request, res: Response): Promise<void>;
    markAllAsRead(req: Request, res: Response): Promise<void>;
    deleteNotification(req: Request, res: Response): Promise<void>;
    getNotificationPreferences(req: Request, res: Response): Promise<void>;
    updateNotificationPreferences(req: Request, res: Response): Promise<void>;
    static createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void>;
    static notifyBatchTransfer(fromUserId: string, toUserId: string, batchId: string, productName: string): Promise<void>;
    static notifyQualityVerification(userId: string, batchId: string, productName: string, verified: boolean): Promise<void>;
    static notifyExpiryWarning(userId: string, batchId: string, productName: string, daysToExpiry: number): Promise<void>;
    static notifyPriceAlert(userId: string, productName: string, oldPrice: number, newPrice: number): Promise<void>;
    static notifySystemUpdate(userId: string, title: string, message: string): Promise<void>;
    static cleanupOldNotifications(): Promise<void>;
}
export declare const notificationController: NotificationController;
export {};
//# sourceMappingURL=notificationController.d.ts.map