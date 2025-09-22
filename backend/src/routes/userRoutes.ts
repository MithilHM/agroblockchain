import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', userController.register.bind(userController));
router.post('/login', userController.login.bind(userController));

// Protected routes
router.get('/profile', authenticate, userController.getProfile.bind(userController));
router.put('/profile', authenticate, userController.updateProfile.bind(userController));

export default router;