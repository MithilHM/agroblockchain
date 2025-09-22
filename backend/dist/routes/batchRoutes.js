"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const batchController_1 = require("../controllers/batchController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Protected routes (require authentication)
router.post('/register', auth_1.auth, batchController_1.batchController.registerBatch);
router.post('/transfer/:batchId', auth_1.auth, batchController_1.batchController.transferBatch);
router.get('/my-batches', auth_1.auth, batchController_1.batchController.getUserBatches);
router.post('/generate-otp', auth_1.auth, batchController_1.batchController.generateOTP);
router.get('/potential-buyers', auth_1.auth, batchController_1.batchController.getPotentialBuyers);
// Public routes (for QR code scanning)
router.get('/:batchId', batchController_1.batchController.getBatch);
exports.default = router;
//# sourceMappingURL=batchRoutes.js.map