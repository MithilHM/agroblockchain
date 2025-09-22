import { Router } from 'express';
import { distributorController } from '../controllers/distributorController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all distributor routes
router.use(authenticate);

// GET /api/distributor/available - Get available distributors for farmers
router.get('/available', distributorController.getAvailableDistributors.bind(distributorController));

// POST /api/distributor/offer - Create batch offer to multiple distributors
router.post('/offer', distributorController.createBatchOffer.bind(distributorController));

// GET /api/distributor/offers - Get batch offers for distributor
router.get('/offers', distributorController.getDistributorOffers.bind(distributorController));

// PUT /api/distributor/offer/:offerId/respond - Respond to batch offer
router.put('/offer/:offerId/respond', distributorController.respondToOffer.bind(distributorController));

// GET /api/distributor/analytics - Get distributor inventory analytics
router.get('/analytics', distributorController.getInventoryAnalytics.bind(distributorController));

export { router as distributorRoutes };