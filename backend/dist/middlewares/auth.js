"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.config.jwt.secret, {
        expiresIn: env_1.config.jwt.expire
    });
};
exports.generateToken = generateToken;
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access token required'
            });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        const userRepository = db_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepository.findOne({
            where: { id: decoded.userId }
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
