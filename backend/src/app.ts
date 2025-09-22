import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { initializeDatabase } from './config/database';
import { RegisterRoutes } from './routes/index';
import { errorHandler } from './middlewares/errorHandler';
import { logger } from './utils/logger';

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'], // React dev servers
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
RegisterRoutes(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AgriChain Backend'
  });
});

// Error handling middleware should come last
app.use(errorHandler);

export default app;