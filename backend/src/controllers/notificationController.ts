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
      const { unread_only = false, page = 1, limit = 20, type } = req.query;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const offset = (Number(page) - 1) * Number(limit);

      let query = supabaseAdmin
        .from('notifications')
        .select(`
          *,
          batch:produce_batches!batch_id(batch_id, product_name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (unread_only === 'true') {
        query = query.eq('read', false);
      }

      if (type && ['info', 'warning', 'success', 'error'].includes(type.toString())) {
        query = query.eq('type', type);
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

      // Get unread count
      const { data: unreadCountData, error: countError } = await supabaseAdmin
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('read', false);

      const unreadCount = unreadCountData?.length || 0;

      res.status(200).json({
        success: true,
        data: {
          notifications: notifications || [],
          unread_count: unreadCount,
          page: Number(page),
          limit: Number(limit),
          total_count: notifications?.length || 0
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

  // Mark all notifications as read
  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        logger.error('Mark all notifications as read error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to mark all notifications as read'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('Mark all notifications as read error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  // Delete notification
  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { notificationId } = req.params;

      const { error } = await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Delete notification error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to delete notification'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Delete notification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }

  // Get notification preferences
  async getNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('metadata')
        .eq('id', userId)
        .single();

      if (error) {
        logger.error('Get notification preferences error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve notification preferences'
        });
        return;
      }

      const preferences = user?.metadata?.notification_preferences || {
        batch_transfers: true,
        quality_updates: true,
        expiry_warnings: true,
        price_alerts: true,
        system_updates: true,
        email_notifications: false,
        sms_notifications: false
      };

      res.status(200).json({
        success: true,
        data: { preferences }
      });
    } catch (error) {
      logger.error('Get notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification preferences'
      });
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { preferences } = req.body;

      // Get current user metadata
      const { data: user, error: getUserError } = await supabaseAdmin
        .from('users')
        .select('metadata')
        .eq('id', userId)
        .single();

      if (getUserError) {
        logger.error('Get user for preferences error:', getUserError);
        res.status(500).json({
          success: false,
          message: 'Failed to update preferences'
        });
        return;
      }

      const updatedMetadata = {
        ...(user?.metadata || {}),
        notification_preferences: {
          ...(user?.metadata?.notification_preferences || {}),
          ...preferences
        }
      };

      const { error } = await supabaseAdmin
        .from('users')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        logger.error('Update notification preferences error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update notification preferences'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: { preferences: updatedMetadata.notification_preferences }
      });
    } catch (error) {
      logger.error('Update notification preferences error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update notification preferences'
      });
    }
  }

  // Create notification (internal method)
  static async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<void> {
    try {
      // Check user preferences before creating notification
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('metadata')
        .eq('id', notification.user_id)
        .single();

      const preferences = user?.metadata?.notification_preferences || {};
      
      // Check if this type of notification is enabled
      let shouldSend = true;
      switch (notification.type) {
        case 'warning':
          shouldSend = preferences.expiry_warnings !== false;
          break;
        case 'success':
          shouldSend = preferences.batch_transfers !== false;
          break;
        case 'info':
          shouldSend = preferences.system_updates !== false;
          break;
        default:
          shouldSend = true;
      }

      if (!shouldSend) {
        return;
      }

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

  // Notify about price changes or market updates
  static async notifyPriceAlert(userId: string, productName: string, oldPrice: number, newPrice: number): Promise<void> {
    const priceChange = ((newPrice - oldPrice) / oldPrice) * 100;
    const isIncrease = newPrice > oldPrice;
    
    await this.createNotification({
      user_id: userId,
      title: `Price ${isIncrease ? 'Increase' : 'Decrease'} Alert`,
      message: `${productName} price ${isIncrease ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(1)}% to $${newPrice}`,
      type: isIncrease ? 'success' : 'warning',
      read: false
    });
  }

  // Notify about system maintenance or updates
  static async notifySystemUpdate(userId: string, title: string, message: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      title,
      message,
      type: 'info',
      read: false
    });
  }

  // Bulk notification cleanup (for admin use)
  static async cleanupOldNotifications(): Promise<void> {
    try {
      const retentionDays = 90; // Could be configurable
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      await supabaseAdmin
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .eq('read', true);

      logger.info(`Cleaned up old notifications older than ${retentionDays} days`);
    } catch (error) {
      logger.error('Cleanup old notifications error:', error);
    }
  }
}

export const notificationController = new NotificationController();