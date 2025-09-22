"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.distributorRoutes = void 0;
const express_1 = require("express");
const distributorController_1 = require("../controllers/distributorController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.distributorRoutes = router;
// Apply authentication middleware to all distributor routes
router.use(auth_1.authenticate);
// GET /api/distributor/available - Get available distributors for farmers
router.get('/available', distributorController_1.distributorController.getAvailableDistributors.bind(distributorController_1.distributorController));
// POST /api/distributor/offer - Create batch offer to multiple distributors
router.post('/offer', distributorController_1.distributorController.createBatchOffer.bind(distributorController_1.distributorController));
// GET /api/distributor/offers - Get batch offers for distributor
router.get('/offers', distributorController_1.distributorController.getDistributorOffers.bind(distributorController_1.distributorController));
// PUT /api/distributor/offer/:offerId/respond - Respond to batch offer
router.put('/offer/:offerId/respond', distributorController_1.distributorController.respondToOffer.bind(distributorController_1.distributorController));
// GET /api/distributor/analytics - Get distributor inventory analytics
router.get('/analytics', distributorController_1.distributorController.getInventoryAnalytics.bind(distributorController_1.distributorController));
//# sourceMappingURL=distributorRoutes.js.map