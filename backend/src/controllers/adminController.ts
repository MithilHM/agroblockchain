import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { logger } from '../utils/logger';

export class AdminController {
  // Get all users with statistics
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Get all users error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve users'
        });
        return;
      }

      // Get user statistics
      const userStats = await Promise.all(
        users.map(async (user: any) => {
          const [batchesRes, transfersRes] = await Promise.all([
            supabaseAdmin
              .from('produce_batches')
              .select('id')
              .eq('current_owner_id', user.id),
            supabaseAdmin
              .from('batch_transfers')
              .select('price_transferred')
              .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
          ]);

          return {
            ...user,
            password_hash: undefined, // Remove password from response
            statistics: {
              total_batches: batchesRes.data?.length || 0,
              total_transactions: transfersRes.data?.length || 0,
              total_value: transfersRes.data?.reduce((sum, t) => 
                sum + parseFloat(t.price_transferred || '0'), 0) || 0
            }
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          users: userStats,
          total_count: users.length
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users'
      });
    }
  }

  // Get system statistics
  async getSystemStats(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      const [usersRes, batchesRes, transfersRes, auditRes] = await Promise.all([
        supabaseAdmin.from('users').select('id, role').eq('role', 'farmer'),
        supabaseAdmin.from('produce_batches').select('*'),
        supabaseAdmin.from('batch_transfers').select('price_transferred'),
        supabaseAdmin.from('audit_logs').select('id').gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const totalValue = transfersRes.data?.reduce((sum, transfer) => 
        sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

      const batchesByStatus = batchesRes.data?.reduce((acc: any, batch) => {
        acc[batch.status] = (acc[batch.status] || 0) + 1;
        return acc;
      }, {}) || {};

      res.status(200).json({
        success: true,
        data: {
          total_users: usersRes.data?.length || 0,
          total_batches: batchesRes.data?.length || 0,
          total_transfers: transfersRes.data?.length || 0,
          total_value: totalValue,
          batches_by_status: batchesByStatus,
          recent_activities: auditRes.data?.length || 0
        }
      });
    } catch (error) {
      logger.error('Get system stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system statistics'
      });
    }
  }

  // Suspend/activate user
  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      const { userId } = req.params;
      const { status } = req.body;
      
      if (userRole !== 'admin') {
        res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
        return;
      }

      if (!['active', 'suspended'].includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status. Must be active or suspended'
        });
        return;
      }

      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, name, email, role, status')
        .single();

      if (error) {
        logger.error('Update user status error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to update user status'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `User ${status} successfully`,
        data: { user: updatedUser }
      });

      logger.info(`Admin updated user ${userId} status to ${status}`);
    } catch (error) {
      logger.error('Update user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user status'
      });
    }
  }

  // Get recent audit logs
  async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      
      if (!['admin', 'regulator'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Admin or regulator access required'
        });
        return;
      }

      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const { data: auditLogs, error } = await supabaseAdmin
        .from('audit_logs')
        .select(`
          *,
          user:users!user_id(name, role),
          batch:produce_batches!batch_id(batch_id, product_name)
        `)
        .order('timestamp', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        logger.error('Get audit logs error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to retrieve audit logs'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          audit_logs: auditLogs,
          page: Number(page),
          limit: Number(limit)
        }
      });
    } catch (error) {
      logger.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve audit logs'
      });
    }
  }

  // Verify batch (quality check)
  async verifyBatch(req: Request, res: Response): Promise<void> {
    try {
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.userId;
      const { batchId } = req.params;
      const { quality_verified, quality_notes, inspector_certificate } = req.body;
      
      if (!['admin', 'regulator'].includes(userRole)) {
        res.status(403).json({
          success: false,
          message: 'Admin or regulator access required'
        });
        return;
      }

      // Get batch details
      const { data: batch, error: batchError } = await supabaseAdmin
        .from('produce_batches')
        .select('*')
        .eq('batch_id', batchId)
        .single();

      if (batchError || !batch) {
        res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
        return;
      }

      // Update batch with quality verification
      const updatedMetadata = {
        ...(batch.metadata || {}),
        quality_verification: {
          verified: quality_verified,
          verified_by: userId,
          verified_at: new Date().toISOString(),
          notes: quality_notes,
          inspector_certificate: inspector_certificate || null
        }
      };

      const { error: updateError } = await supabaseAdmin
        .from('produce_batches')
        .update({
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', batch.id);

      if (updateError) {
        logger.error('Batch verification error:', updateError);
        res.status(500).json({
          success: false,
          message: 'Failed to verify batch'
        });
        return;
      }

      // Create audit log
      await supabaseAdmin
        .from('audit_logs')
        .insert([
          {
            batch_id: batch.id,
            user_id: userId,
            action: 'QUALITY_VERIFIED',
            new_values: { quality_verified, quality_notes },
            timestamp: new Date().toISOString()
          }
        ]);

      res.status(200).json({
        success: true,
        message: 'Batch quality verified successfully',
        data: {
          batch_id: batchId,
          quality_verified,
          verified_by: userRole
        }
      });

      logger.info(`${userRole} verified batch ${batchId}: ${quality_verified}`);
    } catch (error) {
      logger.error('Verify batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify batch'
      });
    }
  }
}

export const adminController = new AdminController();