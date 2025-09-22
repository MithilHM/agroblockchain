"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
// All notification routes require authentication
router.use(auth_1.authenticate);
// GET /api/notifications - Get user notifications (with pagination and filtering)
router.get('/', notificationController_1.notificationController.getUserNotifications.bind(notificationController_1.notificationController));
// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationController_1.notificationController.markAsRead.bind(notificationController_1.notificationController));
// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationController_1.notificationController.markAllAsRead.bind(notificationController_1.notificationController));
// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationController_1.notificationController.deleteNotification.bind(notificationController_1.notificationController));
// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', notificationController_1.notificationController.getNotificationPreferences.bind(notificationController_1.notificationController));
// PUT /api/notifications/preferences - Update notification preferences
router.put('/preferences', notificationController_1.notificationController.updateNotificationPreferences.bind(notificationController_1.notificationController));
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map