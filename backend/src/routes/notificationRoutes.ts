import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

// GET /api/notifications - Get user notifications (with pagination and filtering)
router.get('/', notificationController.getUserNotifications.bind(notificationController));

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationController.markAsRead.bind(notificationController));

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationController.deleteNotification.bind(notificationController));

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', notificationController.getNotificationPreferences.bind(notificationController));

// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', notificationController.updateNotificationPreferences.bind(notificationController));

export default router;