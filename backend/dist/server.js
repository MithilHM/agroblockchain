"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const logger_1 = require("./utils/logger");
async function startServer() {
    try {
        // Initialize database connection
        await (0, database_1.initializeDatabase)();
        // Start the server
        const server = app_1.default.listen(env_1.config.PORT, '0.0.0.0', () => {
            logger_1.logger.info(`✅ Server is running on port ${env_1.config.PORT}`);
            logger_1.logger.info(`🔗 Local: http://localhost:${env_1.config.PORT}`);
            logger_1.logger.info(`🌐 Environment: ${env_1.config.NODE_ENV}`);
        });
        // Graceful shutdown
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, () => {
                logger_1.logger.warn(`Received ${signal}, shutting down gracefully...`);
                server.close(() => {
                    logger_1.logger.info('Server closed.');
                    process.exit(0);
                });
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map