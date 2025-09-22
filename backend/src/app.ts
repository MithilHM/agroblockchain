// src/app.ts
import express from 'express';
import cors from 'cors';
import { AppDataSource } from './config/db';
import { RegisterRoutes } from './routes/index'; // Will pull all routes
import { errorHandler } from './middlewares/errorHandler';

(async () => {
  await AppDataSource.initialize();
  const app = express();

  app.use(cors());
  app.use(express.json()); // parse JSON requests

  RegisterRoutes(app); // Load all routes

  // Error handling middleware should come last
  app.use(errorHandler);

  app.listen(CONFIG.PORT, () => {
    console.log(`Server running on port ${CONFIG.PORT}`);
  });
})();
