import 'reflect-metadata';
import app from './app';
import { config } from './config/env';
import { databaseManager } from './config/database';
import { supabaseService } from './config/supabase';
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

    // Initialize database connection (supports both PostgreSQL and Supabase)
    await databaseManager.initialize();
    const dbInfo = databaseManager.getDatabaseInfo();
    logger.info(`✅ Database connection established: ${dbInfo.type} (mode: ${dbInfo.mode})`);

    // Initialize Supabase if configured
    if (config.supabase.url && config.supabase.anonKey) {
      supabaseService.initialize();
      logger.info('📡 Supabase services initialized');
    }

    // Start the server
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`✅ Server is running on port ${config.PORT}`);
      logger.info(`🔗 Local: http://localhost:${config.PORT}`);
      logger.info(`🔗 Health: http://localhost:${config.PORT}/health`);
      logger.info(`📊 Database: ${dbInfo.type} (${dbInfo.mode} mode)`);
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
          await databaseManager.close();
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
