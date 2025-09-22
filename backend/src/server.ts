import app from './app';
import { logger } from './utils/logger';

// Check for the PORT environment variable, with a fallback to 5001
const PORT = process.env.PORT || 5001;

// Start the server and listen on the specified port
const server = app.listen(PORT, () => {
  logger.info(`✅ Server is running on port ${PORT}`);
  logger.info(`🔗 Local: http://localhost:${PORT}`);
});

// --- Graceful Shutdown ---
// Handle process termination signals to gracefully close the server.
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
