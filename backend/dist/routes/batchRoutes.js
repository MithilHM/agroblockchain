"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const batchController_1 = require("../controllers/batchController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public route to get batch details
router.get('/:batchId', batchController_1.batchController.getBatch.bind(batchController_1.batchController));
// Protected routes
router.post('/register', auth_1.authenticate, batchController_1.batchController.registerBatch.bind(batchController_1.batchController));
exports.default = router;
//# sourceMappingURL=batchRoutes.js.map