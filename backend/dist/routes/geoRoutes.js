"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geoRoutes = void 0;
const express_1 = require("express");
const geoController_1 = require("../controllers/geoController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.geoRoutes = router;
// Apply authentication middleware to all geo routes
router.use(auth_1.authenticate);
// POST /api/geo/batch/:batchId/location - Add geolocation to batch
router.post('/batch/:batchId/location', geoController_1.geoController.addBatchGeolocation.bind(geoController_1.geoController));
// GET /api/geo/batch/:batchId/history - Get batch location history
router.get('/batch/:batchId/history', geoController_1.geoController.getBatchLocationHistory.bind(geoController_1.geoController));
// GET /api/geo/batches/nearby - Get batches by location (within radius)
router.get('/batches/nearby', geoController_1.geoController.getBatchesByLocation.bind(geoController_1.geoController));
// GET /api/geo/analytics - Get user location analytics
router.get('/analytics', geoController_1.geoController.getUserLocationAnalytics.bind(geoController_1.geoController));
//# sourceMappingURL=geoRoutes.js.map