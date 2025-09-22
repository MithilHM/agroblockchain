import { Router } from 'express';
import { geoController } from '../controllers/geoController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all geo routes
router.use(authenticateToken);

// POST /api/geo/batch/:batchId/location - Add geolocation to batch
router.post('/batch/:batchId/location', geoController.addBatchGeolocation.bind(geoController));

// GET /api/geo/batch/:batchId/history - Get batch location history
router.get('/batch/:batchId/history', geoController.getBatchLocationHistory.bind(geoController));

// GET /api/geo/batches/nearby - Get batches by location (within radius)
router.get('/batches/nearby', geoController.getBatchesByLocation.bind(geoController));

// GET /api/geo/analytics - Get user location analytics
router.get('/analytics', geoController.getUserLocationAnalytics.bind(geoController));

export { router as geoRoutes };