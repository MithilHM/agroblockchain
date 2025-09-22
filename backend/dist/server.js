"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const supabase_1 = require("./config/supabase");
const logger_1 = require("./utils/logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
async function startServer() {
    try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path_1.default.join(__dirname, '../uploads');
        if (!fs_1.default.existsSync(uploadsDir)) {
            fs_1.default.mkdirSync(uploadsDir, { recursive: true });
            logger_1.logger.info('Created uploads directory');
        }
        // Initialize database connection (supports both PostgreSQL and Supabase)
        await database_1.databaseManager.initialize();
        const dbInfo = database_1.databaseManager.getDatabaseInfo();
        logger_1.logger.info(`✅ Database connection established: ${dbInfo.type} (mode: ${dbInfo.mode})`);
        // Initialize Supabase if configured
        if (env_1.config.supabase.url && env_1.config.supabase.anonKey) {
            supabase_1.supabaseService.initialize();
            logger_1.logger.info('📡 Supabase services initialized');
        }
        // Start the server
        const server = app_1.default.listen(env_1.config.PORT, '0.0.0.0', () => {
            logger_1.logger.info(`✅ Server is running on port ${env_1.config.PORT}`);
            logger_1.logger.info(`🔗 Local: http://localhost:${env_1.config.PORT}`);
            logger_1.logger.info(`🔗 Health: http://localhost:${env_1.config.PORT}/health`);
            logger_1.logger.info(`📊 Database: ${dbInfo.type} (${dbInfo.mode} mode)`);
        });
        // Graceful shutdown handlers
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                logger_1.logger.warn(`Received ${signal}, shutting down gracefully...`);
                server.close(() => {
                    logger_1.logger.info('HTTP server closed');
                });
                try {
                    await database_1.databaseManager.close();
                    logger_1.logger.info('Database connection closed');
                }
                catch (error) {
                    logger_1.logger.error('Error closing database connection:', error);
                }
                process.exit(0);
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
