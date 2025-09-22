import { Router } from 'express';
import { userController } from '../controllers/userController';
import { auth } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));

// Protected routes
router.get('/profile', auth, userController.getProfile.bind(userController));
router.put('/profile', auth, userController.updateProfile.bind(userController));
router.get('/dashboard-stats', auth, userController.getDashboardStats.bind(userController));

export default router;