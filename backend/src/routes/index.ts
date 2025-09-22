// src/routes/index.ts
import { Express } from 'express';

import batchRoutes from './batchRoutes';
import userRoutes from './userRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';
import { walletRoutes } from './walletRoutes';
import { geoRoutes } from './geoRoutes';

export function RegisterRoutes(app: Express) {
  app.use('/api/batch', batchRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/geo', geoRoutes);
}