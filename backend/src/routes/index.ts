// src/routes/index.ts
import { Express } from 'express';

import batchRoutes from './batchRoutes';
import userRoutes from './userRoutes';

export function RegisterRoutes(app: Express) {
  app.use('/api/batch', batchRoutes);
  app.use('/api/user', userRoutes);
}