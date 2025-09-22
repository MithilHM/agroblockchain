import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { auth } from '../middlewares/auth';

const router = Router();

// All notification routes require authentication
router.use(auth);

// Get user notifications
router.get('/', notificationController.getUserNotifications);

// Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead);

export default router;