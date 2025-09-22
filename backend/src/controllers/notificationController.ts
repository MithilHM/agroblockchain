import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

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

export class NotificationController {
  // Get user notifications
  async getUserNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { unread_only = false } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      let query = supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unread_only === 'true') {
        query = query.eq('read', false);
      }

      const { data: notifications, error } = await query;

      if (error) {
        logger.error('Get notifications error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve notifications'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          notifications: notifications || [],
          unread_count: notifications?.filter(n => !n.read).length || 0
        }
      });
    } catch (error) {
      logger.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications'
      });
    }
  }

  // Mark notification as read
  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { notificationId } = req.params;

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Mark notification as read error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to mark notification as read'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Mark notification as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }

  // Create notification (internal method)
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('notifications')
        .insert([{
          ...notification,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        logger.error('Create notification error:', error);
      }
    } catch (error) {
      logger.error('Create notification error:', error);
    }
  }

  // Notify about batch transfer
  static async notifyBatchTransfer(fromUserId: string, toUserId: string, batchId: string, productName: string): Promise<void> {
    await Promise.all([
      this.createNotification({
        user_id: fromUserId,
        title: 'Batch Transferred',
        message: `Your batch of ${productName} has been successfully transferred`,
        type: 'success',
        batch_id: batchId,
        read: false
      }),
      this.createNotification({
        user_id: toUserId,
        title: 'New Batch Received',
        message: `You have received a new batch of ${productName}`,
        type: 'info',
        batch_id: batchId,
        read: false
      })
    ]);
  }

  // Notify about quality verification
  static async notifyQualityVerification(userId: string, batchId: string, productName: string, verified: boolean): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: verified ? 'Quality Verified' : 'Quality Issues Found',
      message: `Quality verification ${verified ? 'passed' : 'failed'} for your batch of ${productName}`,
      type: verified ? 'success' : 'warning',
      batch_id: batchId,
      read: false
    });
  }

  // Notify about batch expiry warning
  static async notifyExpiryWarning(userId: string, batchId: string, productName: string, daysToExpiry: number): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title: 'Batch Expiry Warning',
      message: `Your batch of ${productName} will expire in ${daysToExpiry} days`,
      type: 'warning',
      batch_id: batchId,
      read: false
    });
  }
}

export const notificationController = new NotificationController();