"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const batchController_1 = require("../controllers/batchController");
const auth_1 = require("../middlewares/auth");
const validators_1 = require("../utils/validators");
const User_1 = require("../models/User");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// Batch management routes
router.post('/register', (0, auth_1.requireRole)([User_1.UserRole.FARMER]), validators_1.validateBatchRegistration, batchController_1.batchController.registerBatch);
router.get('/:batchId', validators_1.validateBatchId, batchController_1.batchController.getBatch);
router.put('/:batchId/transfer', validators_1.validateBatchId, validators_1.validateBatchTransfer, batchController_1.batchController.transferBatch);
router.put('/:batchId/status', validators_1.validateBatchId, batchController_1.batchController.updateBatchStatus);
router.get('/', batchController_1.batchController.getUserBatches);
router.get('/:batchId/history', validators_1.validateBatchId, batchController_1.batchController.getBatchHistory);
exports.default = router;
