"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication
router.use(auth_1.auth);
// User management
router.get('/users', adminController_1.adminController.getAllUsers);
router.put('/users/:userId/status', adminController_1.adminController.updateUserStatus);
// System statistics
router.get('/stats', adminController_1.adminController.getSystemStats);
// Audit logs
router.get('/audit-logs', adminController_1.adminController.getAuditLogs);
// Quality verification
router.post('/verify-batch/:batchId', adminController_1.adminController.verifyBatch);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map