"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("./errorHandler");
/**
 * Middleware to authenticate requests using JWT.
 * It verifies the token from the Authorization header and attaches the user to the request object.
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new errorHandler_1.AppError('Authentication failed: No token provided.', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.jwt.secret);
        // Attach user information to the request object
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new errorHandler_1.AppError('Authentication failed: Invalid token.', 401));
        }
        next(error);
    }
};
exports.authenticate = authenticate;
/**
 * Generate JWT token for user
 */
const generateToken = (userId, email, role) => {
    return jsonwebtoken_1.default.sign({ userId, email, role }, env_1.config.jwt.secret, { expiresIn: env_1.config.jwt.expire });
};
exports.generateToken = generateToken;
//# sourceMappingURL=auth.js.map