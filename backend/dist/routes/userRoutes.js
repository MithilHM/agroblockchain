"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', userController_1.userController.register.bind(userController_1.userController));
router.post('/login', userController_1.userController.login.bind(userController_1.userController));
// Protected routes
router.get('/profile', auth_1.auth, userController_1.userController.getProfile.bind(userController_1.userController));
router.put('/profile', auth_1.auth, userController_1.userController.updateProfile.bind(userController_1.userController));
router.get('/dashboard-stats', auth_1.auth, userController_1.userController.getDashboardStats.bind(userController_1.userController));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map