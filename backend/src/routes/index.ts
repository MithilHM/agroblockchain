// src/routes/index.ts
import { Express } from 'express';

import batchRoutes from './batchRoutes';
import userRoutes from './userRoutes';
import supabaseUserRoutes from './supabaseUserRoutes';
import fileRoutes from './fileRoutes';
import qrRoutes from './qrRoutes';
import { config } from '../config/env';

export function RegisterRoutes(app: Express) {
  // Use Supabase routes when in Supabase mode
  if (config.database.mode === 'supabase') {
    app.use('/api/user', supabaseUserRoutes);
  } else {
    app.use('/api/user', userRoutes);
  }
  
  app.use('/api/batch', batchRoutes);
  app.use('/api/file', fileRoutes);
  app.use('/api/qr', qrRoutes);
}