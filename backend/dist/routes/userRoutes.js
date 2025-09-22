"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const validators_1 = require("../utils/validators");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', validators_1.validateUserRegistration, userController_1.userController.register);
router.post('/login', validators_1.validateUserLogin, userController_1.userController.login);
// Protected routes
router.get('/profile', auth_1.authenticateToken, userController_1.userController.getProfile);
router.put('/profile', auth_1.authenticateToken, userController_1.userController.updateProfile);
router.get('/dashboard', auth_1.authenticateToken, userController_1.userController.getDashboard);
exports.default = router;
