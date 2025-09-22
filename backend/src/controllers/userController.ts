import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../config/supabase';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'farmer' | 'distributor' | 'retailer';
  wallet_address?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role, wallet_address } = req.body;

      // Validate input
      if (!email || !password || !name || !role) {
        res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      if (!['farmer', 'distributor', 'retailer'].includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
        return;
      }

      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user in database
      const userId = uuidv4();
      const { data: newUser, error } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: userId,
            email,
            password_hash: hashedPassword,
            name,
            role,
            wallet_address: wallet_address || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select('id, email, name, role, wallet_address, created_at')
        .single();

      if (error) {
        logger.error('User registration error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to create user'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.id, email: newUser.email, role: newUser.role },
        config.jwt.secret as string,
        { expiresIn: config.jwt.expire as string }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            wallet_address: newUser.wallet_address
          },
          token
        }
      });

      logger.info(`User registered: ${email} with role: ${role}`);
    } catch (error) {
      logger.error('User registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, password_hash, wallet_address')
        .eq('email', email)
        .single();

      if (error || !user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expire }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            wallet_address: user.wallet_address
          },
          token
        }
      });

      logger.info(`User logged in: ${email}`);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, wallet_address, created_at')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user's batch statistics
      const { data: batchStats } = await supabaseAdmin
        .from('produce_batches')
        .select('id, status')
        .eq('current_owner_id', userId);

      // Get transfer statistics
      const { data: outboundTransfers } = await supabaseAdmin
        .from('batch_transfers')
        .select('id, price_transferred')
        .eq('from_user_id', userId);

      const { data: inboundTransfers } = await supabaseAdmin
        .from('batch_transfers')
        .select('id, price_transferred')
        .eq('to_user_id', userId);

      const totalOutboundSales = outboundTransfers?.reduce((sum, transfer) => 
        sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

      const totalInboundPurchases = inboundTransfers?.reduce((sum, transfer) => 
        sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

      res.status(200).json({
        success: true,
        data: { 
          user,
          statistics: {
            current_batches: batchStats?.length || 0,
            outbound_sales: outboundTransfers?.length || 0,
            inbound_purchases: inboundTransfers?.length || 0,
            total_sales_value: totalOutboundSales,
            total_purchase_value: totalInboundPurchases
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile'
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { name, wallet_address } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      const { data: updatedUser, error } = await supabaseAdmin
        .from('users')
        .update({
          name,
          wallet_address,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('id, email, name, role, wallet_address')
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          message: 'Failed to update profile'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user: updatedUser }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile'
      });
    }
  }

  // Get dashboard statistics for each role
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
        return;
      }

      let stats: any = {};

      if (userRole === 'farmer') {
        // Farmer statistics
        const { data: totalBatches } = await supabaseAdmin
          .from('produce_batches')
          .select('id')
          .eq('current_owner_id', userId);

        const { data: soldBatches } = await supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred')
          .eq('from_user_id', userId);

        const totalRevenue = soldBatches?.reduce((sum, transfer) => 
          sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

        stats = {
          total_batches_registered: totalBatches?.length || 0,
          batches_sold: soldBatches?.length || 0,
          total_revenue: totalRevenue,
          active_listings: totalBatches?.length || 0
        };
      } else if (userRole === 'distributor') {
        // Distributor statistics
        const { data: currentInventory } = await supabaseAdmin
          .from('produce_batches')
          .select('id, price_per_unit, quantity')
          .eq('current_owner_id', userId);

        const { data: purchases } = await supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred')
          .eq('to_user_id', userId);

        const { data: sales } = await supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred')
          .eq('from_user_id', userId);

        const totalPurchases = purchases?.reduce((sum, transfer) => 
          sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

        const totalSales = sales?.reduce((sum, transfer) => 
          sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

        stats = {
          current_inventory: currentInventory?.length || 0,
          total_purchases: purchases?.length || 0,
          total_sales: sales?.length || 0,
          purchase_value: totalPurchases,
          sales_value: totalSales,
          profit_margin: totalSales - totalPurchases
        };
      } else if (userRole === 'retailer') {
        // Retailer statistics
        const { data: currentStock } = await supabaseAdmin
          .from('produce_batches')
          .select('id, price_per_unit, quantity')
          .eq('current_owner_id', userId);

        const { data: purchases } = await supabaseAdmin
          .from('batch_transfers')
          .select('price_transferred')
          .eq('to_user_id', userId);

        const totalPurchases = purchases?.reduce((sum, transfer) => 
          sum + parseFloat(transfer.price_transferred || '0'), 0) || 0;

        stats = {
          current_stock: currentStock?.length || 0,
          total_purchases: purchases?.length || 0,
          purchase_value: totalPurchases,
          ready_for_sale: currentStock?.filter(batch => 
            batch.status === 'delivered')?.length || 0
        };
      }

      res.status(200).json({
        success: true,
        data: {
          role: userRole,
          statistics: stats
        }
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard statistics'
      });
    }
  }
}

export const userController = new UserController();