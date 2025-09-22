"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrController_1 = require("../controllers/qrController");
const auth_1 = require("../middlewares/auth");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
// Public route for QR code scanning
router.get('/scan/:batchId', validators_1.validateBatchId, qrController_1.qrController.scanQR);
// Protected routes
router.use(auth_1.authenticateToken);
router.post('/generate/:batchId', validators_1.validateBatchId, qrController_1.qrController.generateQR);
router.get('/:batchId', validators_1.validateBatchId, qrController_1.qrController.getQR);
exports.default = router;
