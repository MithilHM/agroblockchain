import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

import { logger } from './utils/logger';
import { AppError, errorHandler } from './middlewares/errorHandler';

// --- Import API Routes ---
// (Assuming you will have an index file in 'routes' that exports all routers)
import userRoutes from './routes/userRoutes';
import batchRoutes from './routes/batchRoutes';
import qrRoutes from './routes/qrRoutes';
import fileRoutes from './routes/fileRoutes';

// --- Initialize Express App ---
const app: Express = express();

// --- Core Middlewares ---

// 1. CORS (Cross-Origin Resource Sharing)
// Allows requests from your frontend application.
// Configure the origin to match your frontend's URL in production.
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000', // Default for local dev
  })
);

// 2. Helmet for setting various security HTTP headers
app.use(helmet());

// 3. Express JSON Parser
// Parses incoming requests with JSON payloads.
app.use(express.json());

// 4. URL-encoded Parser
// Parses incoming requests with URL-encoded payloads.
app.use(express.urlencoded({ extended: true }));

// 5. HTTP Request Logger (Morgan)
// Logs every incoming request to the console for debugging.
// We pipe the output to our Winston logger to have unified logs.
const stream = {
  write: (message: string) => logger.http(message.trim()),
};
app.use(morgan('dev', { stream }));

// --- API Routes ---
const apiBasePath = '/api';

app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/batches`, batchRoutes);
app.use(`${apiBasePath}/files`, fileRoutes);
app.use(`${apiBasePath}/qr`, qrRoutes);

// --- Health Check Endpoint ---
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// --- 404 Not Found Handler ---
// This middleware catches any request that doesn't match a defined route.
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
});

// --- Global Error Handling Middleware ---
// This MUST be the last middleware added to the app.
// It catches all errors passed by next() from any part of the application.
app.use(errorHandler);

export default app;
