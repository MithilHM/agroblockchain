import app from './app';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import { logger } from './utils/logger';

async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Start the server
    const server = app.listen(config.PORT, '0.0.0.0', () => {
      logger.info(`✅ Server is running on port ${config.PORT}`);
      logger.info(`🔗 Local: http://localhost:${config.PORT}`);
      logger.info(`🌐 Environment: ${config.NODE_ENV}`);
    });

    // Graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.warn(`Received ${signal}, shutting down gracefully...`);
        server.close(() => {
          logger.info('Server closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();