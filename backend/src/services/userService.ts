import bcrypt from 'bcryptjs';
import { supabaseService } from '../config/supabase';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export interface UserData {
  id?: string;
  email: string;
  password_hash?: string;
  role: 'farmer' | 'distributor' | 'retailer' | 'consumer' | 'regulator';
  first_name: string;
  last_name: string;
  phone?: string;
  wallet_address?: string;
  company_name?: string;
  license_number?: string;
  is_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  /**
   * Create a new user
   */
  async createUser(userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>): Promise<UserData | null> {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Database connection not available');
    }

    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password_hash!, 12);
      
      const userToInsert = {
        ...userData,
        password_hash: hashedPassword,
        is_verified: userData.is_verified || false,
        is_active: userData.is_active !== false
      };

      const { data, error } = await client
        .from('users')
        .insert([userToInsert])
        .select()
        .single();

      if (error) {
        logger.error('Error creating user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<UserData | null> {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Database connection not available');
    }

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        logger.error('Error finding user by email:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error('Error in findUserByEmail:', error);
      return null;
    }
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<UserData | null> {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Database connection not available');
    }

    try {
      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error finding user by ID:', error);
        throw error;
      }

      return data || null;
    } catch (error) {
      logger.error('Error in findUserById:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<UserData>): Promise<UserData | null> {
    const client = supabaseService.getClient();
    if (!client) {
      throw new Error('Database connection not available');
    }

    try {
      const { data, error } = await client
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user:', error);
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Verify password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Create audit log
   */
  async createAuditLog(action: string, userId: string, details: any): Promise<void> {
    const client = supabaseService.getClient();
    if (!client) {
      return; // Fail silently for audit logs
    }

    try {
      await client
        .from('audit_logs')
        .insert([{
          action,
          user_id: userId,
          resource_type: 'user',
          resource_id: userId,
          new_values: details,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      logger.error('Error creating audit log:', error);
      // Don't throw - audit logs shouldn't break main functionality
    }
  }
}

export const userService = new UserService();