import { Router } from 'express';
import { userController } from '../controllers/userController';
import { validateUserRegistration, validateUserLogin } from '../utils/validators';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/register', validateUserRegistration, userController.register);
router.post('/login', validateUserLogin, userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.get('/dashboard', authenticateToken, userController.getDashboard);

export default router;