import { Router } from 'express';
import { supabaseUserController } from '../controllers/supabaseUserController';
import { authenticateToken } from '../middlewares/supabaseAuth';

const router = Router();

// Public routes
router.post('/register', supabaseUserController.register);
router.post('/login', supabaseUserController.login);

// Protected routes
router.get('/profile', authenticateToken, supabaseUserController.getProfile);
router.put('/profile', authenticateToken, supabaseUserController.updateProfile);
router.get('/dashboard', authenticateToken, supabaseUserController.getDashboard);

export default router;