import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { auth } from '../middlewares/auth';

const router = Router();

// All admin routes require authentication
router.use(auth);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);

// System statistics
router.get('/stats', adminController.getSystemStats);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// Quality verification
router.post('/verify-batch/:batchId', adminController.verifyBatch);

export default router;