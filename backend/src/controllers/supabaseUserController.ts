import { Request, Response } from 'express';
import { userService, UserData } from '../services/userService';
import { generateToken, AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middlewares/errorHandler';

export class SupabaseUserController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, first_name, last_name, role, phone, address, company_name } = req.body;

      // Validate required fields
      if (!email || !password || !first_name || !last_name || !role) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: email, password, first_name, last_name, role'
        });
        return;
      }

      // Check if user already exists
      const existingUser = await userService.findUserByEmail(email);
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
        return;
      }

      // Create new user
      const userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'> = {
        email,
        password_hash: password, // Will be hashed in the service
        first_name,
        last_name,
        role,
        phone,
        company_name,
        is_verified: false,
        is_active: true
      };

      const newUser = await userService.createUser(userData);
      if (!newUser) {
        res.status(500).json({
          success: false,
          message: 'Failed to create user'
        });
        return;
      }

      // Generate token
      const token = generateToken(newUser.id!);

      // Create audit log
      await userService.createAuditLog('USER_REGISTERED', newUser.id!, {
        email: newUser.email,
        role: newUser.role
      });

      // Remove password from response
      const { password_hash, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      });

      logger.info(`User registered: ${email} with role: ${role}`);

    } catch (error: any) {
      logger.error('Registration error:', error);
      
      // Handle case where tables don't exist
      if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        res.status(503).json({
          success: false,
          message: 'Database tables are not set up yet. Please contact administrator.',
          error: 'DATABASE_NOT_READY'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      // Find user by email
      const user = await userService.findUserByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Check if user is active
      if (!user.is_active) {
        res.status(401).json({
          success: false,
          message: 'Account is suspended or inactive'
        });
        return;
      }

      // Verify password
      const isPasswordValid = await userService.verifyPassword(password, user.password_hash!);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
        return;
      }

      // Generate token
      const token = generateToken(user.id!);

      // Create audit log
      await userService.createAuditLog('USER_LOGIN', user.id!, {
        email: user.email,
        loginTime: new Date()
      });

      // Remove password from response
      const { password_hash, ...userResponse } = user;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });

      logger.info(`User logged in: ${email}`);

    } catch (error: any) {
      logger.error('Login error:', error);
      
      // Handle case where tables don't exist
      if (error.message?.includes('does not exist') || error.message?.includes('schema cache')) {
        res.status(503).json({
          success: false,
          message: 'Database tables are not set up yet. Please contact administrator.',
          error: 'DATABASE_NOT_READY'
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await userService.findUserById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const { password_hash, ...userProfile } = user;

      res.status(200).json({
        success: true,
        data: {
          user: userProfile
        }
      });

    } catch (error: any) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
        error: error.message
      });
    }
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { first_name, last_name, phone, company_name } = req.body;
      const updates: Partial<UserData> = {};

      if (first_name) updates.first_name = first_name;
      if (last_name) updates.last_name = last_name;
      if (phone) updates.phone = phone;
      if (company_name) updates.company_name = company_name;

      const updatedUser = await userService.updateUser(userId, updates);
      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const { password_hash, ...userResponse } = updatedUser;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: userResponse
        }
      });

      logger.info(`Profile updated for user: ${userId}`);

    } catch (error: any) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  });

  // Simple dashboard that works even without complex tables
  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const dashboardData = {
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          role: user.role
        },
        stats: {
          totalBatches: 0,
          activeBatches: 0,
          completedTransactions: 0
        },
        recentActivity: [],
        message: `Welcome to your ${user.role} dashboard!`
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error: any) {
      logger.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  });
}

export const supabaseUserController = new SupabaseUserController();