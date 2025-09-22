import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/db';
import { User, UserRole, UserStatus } from '../models/User';
import { ProduceBatch } from '../models/ProduceBatch';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { generateToken, AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middlewares/errorHandler';

export class UserController {
  private userRepository = AppDataSource.getRepository(User);
  private batchRepository = AppDataSource.getRepository(ProduceBatch);
  private auditRepository = AppDataSource.getRepository(AuditLog);

  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password, name, role, phone, address, walletAddress } = req.body;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email }
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.name = name;
    user.role = role as UserRole;
    user.phone = phone;
    user.address = address;
    user.walletAddress = walletAddress;
    user.status = UserStatus.ACTIVE;

    const savedUser = await this.userRepository.save(user);

    // Generate token
    const token = generateToken(savedUser.id);

    // Create audit log
    await this.createAuditLog(AuditAction.USER_REGISTERED, savedUser.id, null, {
      email: savedUser.email,
      role: savedUser.role
    });

    // Remove password from response
    const { password: _, ...userResponse } = savedUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });

    logger.info(`User registered: ${email} with role: ${role}`);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      res.status(401).json({
        success: false,
        message: 'Account is suspended or inactive'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user.id);

    // Create audit log
    await this.createAuditLog(AuditAction.USER_LOGIN, user.id, null, {
      email: user.email,
      loginTime: new Date()
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });

    logger.info(`User logged in: ${email}`);
  });

  getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const { password: _, ...userProfile } = user;

    res.status(200).json({
      success: true,
      data: {
        user: userProfile
      }
    });
  });

  updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { name, phone, address, walletAddress } = req.body;

    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update user profile
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (walletAddress) user.walletAddress = walletAddress;

    const updatedUser = await this.userRepository.save(user);
    const { password: _, ...userResponse } = updatedUser;

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });

    logger.info(`Profile updated for user: ${userId}`);
  });

  getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const user = req.user!;
    
    let dashboardData: any = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    };

    // Get role-specific dashboard data
    switch (user.role) {
      case UserRole.FARMER:
        dashboardData = await this.getFarmerDashboard(user.id);
        break;
      case UserRole.DISTRIBUTOR:
        dashboardData = await this.getDistributorDashboard(user.id);
        break;
      case UserRole.RETAILER:
        dashboardData = await this.getRetailerDashboard(user.id);
        break;
      case UserRole.REGULATOR:
      case UserRole.ADMIN:
        dashboardData = await this.getAdminDashboard(user.id);
        break;
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  });

  private async getFarmerDashboard(farmerId: string) {
    const totalBatches = await this.batchRepository.count({
      where: { originalFarmerId: farmerId }
    });

    const activeBatches = await this.batchRepository.count({
      where: { 
        originalFarmerId: farmerId,
        status: 'harvested'
      }
    });

    const recentBatches = await this.batchRepository.find({
      where: { originalFarmerId: farmerId },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['currentOwner']
    });

    return {
      role: 'farmer',
      stats: {
        totalBatches,
        activeBatches,
        soldBatches: totalBatches - activeBatches
      },
      recentBatches
    };
  }

  private async getDistributorDashboard(distributorId: string) {
    const inventory = await this.batchRepository.count({
      where: { 
        currentOwnerId: distributorId,
        status: 'with_distributor'
      }
    });

    const totalPurchases = await this.batchRepository.count({
      where: { currentOwnerId: distributorId }
    });

    const recentBatches = await this.batchRepository.find({
      where: { currentOwnerId: distributorId },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['currentOwner']
    });

    return {
      role: 'distributor',
      stats: {
        inventory,
        totalPurchases,
        inTransit: 0 // TODO: Calculate based on status
      },
      recentBatches
    };
  }

  private async getRetailerDashboard(retailerId: string) {
    const inventory = await this.batchRepository.count({
      where: { 
        currentOwnerId: retailerId,
        status: 'with_retailer'
      }
    });

    const totalPurchases = await this.batchRepository.count({
      where: { currentOwnerId: retailerId }
    });

    const recentBatches = await this.batchRepository.find({
      where: { currentOwnerId: retailerId },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['currentOwner']
    });

    return {
      role: 'retailer',
      stats: {
        inventory,
        totalPurchases,
        soldItems: 0 // TODO: Calculate based on sold status
      },
      recentBatches
    };
  }

  private async getAdminDashboard(adminId: string) {
    const totalUsers = await this.userRepository.count();
    const totalBatches = await this.batchRepository.count();
    const recentActivity = await this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: 10,
      relations: ['user', 'batch']
    });

    return {
      role: 'admin',
      stats: {
        totalUsers,
        totalBatches,
        recentActivity: recentActivity.length
      },
      recentActivity
    };
  }

  private async createAuditLog(action: AuditAction, userId: string, batchId: string | null, details: any): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.action = action;
      auditLog.userId = userId;
      auditLog.batchId = batchId;
      auditLog.details = details;

      await this.auditRepository.save(auditLog);
    } catch (error) {
      logger.error('Error creating audit log:', error);
    }
  }
}

export const userController = new UserController();