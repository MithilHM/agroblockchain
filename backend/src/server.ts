import 'reflect-metadata';
import app from './app';
import { config } from './config/env';
import { AppDataSource } from './config/db';
import { logger } from './utils/logger';
import fs from 'fs';
import path from 'path';

async function startServer() {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info('Created uploads directory');
    }

    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('✅ Database connection established');

    // Start the server
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`✅ Server is running on port ${config.PORT}`);
      logger.info(`🔗 Local: http://localhost:${config.PORT}`);
      logger.info(`🔗 Health: http://localhost:${config.PORT}/health`);
    });

    // Graceful shutdown handlers
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.warn(`Received ${signal}, shutting down gracefully...`);
        
        server.close(() => {
          logger.info('HTTP server closed');
        });

        try {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
        } catch (error) {
          logger.error('Error closing database connection:', error);
        }

        process.exit(0);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
