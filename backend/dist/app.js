"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("./config/env");
const index_1 = require("./routes/index");
const errorHandler_1 = require("./middlewares/errorHandler");
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
// Security middleware
app.use((0, helmet_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.windowMs,
    max: env_1.config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? false : true,
    credentials: true
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve uploaded files statically
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Supply Chain API is running',
        timestamp: new Date().toISOString()
    });
});
// Register all routes
(0, index_1.RegisterRoutes)(app);
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
exports.default = app;
