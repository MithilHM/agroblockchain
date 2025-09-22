"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const supabase_1 = require("../config/supabase");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class UserController {
    async register(req, res) {
        try {
            const { email, password, name, role } = req.body;
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
            const { data: existingUser } = await supabase_1.supabaseAdmin
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
            const hashedPassword = await bcryptjs_1.default.hash(password, saltRounds);
            // Create user in database
            const userId = (0, uuid_1.v4)();
            const { data: newUser, error } = await supabase_1.supabaseAdmin
                .from('users')
                .insert([
                {
                    id: userId,
                    email,
                    password_hash: hashedPassword,
                    name,
                    role,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ])
                .select('id, email, name, role, created_at')
                .single();
            if (error) {
                logger_1.logger.error('User registration error:', error);
                res.status(500).json({
                    success: false,
                    message: 'Failed to create user'
                });
                return;
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: newUser.id, email: newUser.email, role: newUser.role }, env_1.config.jwt.secret, { expiresIn: env_1.config.jwt.expire });
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: newUser.id,
                        email: newUser.email,
                        name: newUser.name,
                        role: newUser.role
                    },
                    token
                }
            });
            logger_1.logger.info(`User registered: ${email} with role: ${role}`);
        }
        catch (error) {
            logger_1.logger.error('User registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Registration failed'
            });
        }
    }
    async login(req, res) {
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
            const { data: user, error } = await supabase_1.supabaseAdmin
                .from('users')
                .select('id, email, name, role, password_hash')
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
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
                return;
            }
            // Generate JWT token
            const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, env_1.config.jwt.secret, { expiresIn: env_1.config.jwt.expire });
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role
                    },
                    token
                }
            });
            logger_1.logger.info(`User logged in: ${email}`);
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Login failed'
            });
        }
    }
    async getProfile(req, res) {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const { data: user, error } = await supabase_1.supabaseAdmin
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
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get profile'
            });
        }
    }
    async updateProfile(req, res) {
        try {
            const userId = req.user?.userId;
            const { name, wallet_address } = req.body;
            if (!userId) {
                res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
                return;
            }
            const { data: updatedUser, error } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile'
            });
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
//# sourceMappingURL=userController.js.map