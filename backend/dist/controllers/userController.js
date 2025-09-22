"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const ProduceBatch_1 = require("../models/ProduceBatch");
const Auditlog_1 = require("../models/Auditlog");
const auth_1 = require("../middlewares/auth");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middlewares/errorHandler");
class UserController {
    constructor() {
        this.userRepository = db_1.AppDataSource.getRepository(User_1.User);
        this.batchRepository = db_1.AppDataSource.getRepository(ProduceBatch_1.ProduceBatch);
        this.auditRepository = db_1.AppDataSource.getRepository(Auditlog_1.AuditLog);
        this.register = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
            // Create new user
            const user = new User_1.User();
            user.email = email;
            user.password = hashedPassword;
            user.name = name;
            user.role = role;
            user.phone = phone;
            user.address = address;
            user.walletAddress = walletAddress;
            user.status = User_1.UserStatus.ACTIVE;
            const savedUser = await this.userRepository.save(user);
            // Generate token
            const token = (0, auth_1.generateToken)(savedUser.id);
            // Create audit log
            await this.createAuditLog(Auditlog_1.AuditAction.USER_REGISTERED, savedUser.id, null, {
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
            logger_1.logger.info(`User registered: ${email} with role: ${role}`);
        });
        this.login = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            if (user.status !== User_1.UserStatus.ACTIVE) {
                res.status(401).json({
                    success: false,
                    message: 'Account is suspended or inactive'
                });
                return;
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
                return;
            }
            // Generate token
            const token = (0, auth_1.generateToken)(user.id);
            // Create audit log
            await this.createAuditLog(Auditlog_1.AuditAction.USER_LOGIN, user.id, null, {
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
            logger_1.logger.info(`User logged in: ${email}`);
        });
        this.getProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            const { password: _, ...userProfile } = user;
            res.status(200).json({
                success: true,
                data: {
                    user: userProfile
                }
            });
        });
        this.updateProfile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
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
            if (name)
                user.name = name;
            if (phone)
                user.phone = phone;
            if (address)
                user.address = address;
            if (walletAddress)
                user.walletAddress = walletAddress;
            const updatedUser = await this.userRepository.save(user);
            const { password: _, ...userResponse } = updatedUser;
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: {
                    user: userResponse
                }
            });
            logger_1.logger.info(`Profile updated for user: ${userId}`);
        });
        this.getDashboard = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const user = req.user;
            let dashboardData = {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            };
            // Get role-specific dashboard data
            switch (user.role) {
                case User_1.UserRole.FARMER:
                    dashboardData = await this.getFarmerDashboard(user.id);
                    break;
                case User_1.UserRole.DISTRIBUTOR:
                    dashboardData = await this.getDistributorDashboard(user.id);
                    break;
                case User_1.UserRole.RETAILER:
                    dashboardData = await this.getRetailerDashboard(user.id);
                    break;
                case User_1.UserRole.REGULATOR:
                case User_1.UserRole.ADMIN:
                    dashboardData = await this.getAdminDashboard(user.id);
                    break;
            }
            res.status(200).json({
                success: true,
                data: dashboardData
            });
        });
    }
    async getFarmerDashboard(farmerId) {
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
    async getDistributorDashboard(distributorId) {
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
    async getRetailerDashboard(retailerId) {
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
    async getAdminDashboard(adminId) {
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
    async createAuditLog(action, userId, batchId, details) {
        try {
            const auditLog = new Auditlog_1.AuditLog();
            auditLog.action = action;
            auditLog.userId = userId;
            auditLog.batchId = batchId;
            auditLog.details = details;
            await this.auditRepository.save(auditLog);
        }
        catch (error) {
            logger_1.logger.error('Error creating audit log:', error);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
