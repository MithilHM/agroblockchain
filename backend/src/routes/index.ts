// src/routes/index.ts
import { Express } from 'express';

import batchRoutes from './batchRoutes';
import userRoutes from './userRoutes';
import fileRoutes from './fileRoutes';
import qrRoutes from './qrRoutes';

export function RegisterRoutes(app: Express) {
  app.use('/api/batch', batchRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/file', fileRoutes);
  app.use('/api/qr', qrRoutes);
}