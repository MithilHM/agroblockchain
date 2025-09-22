import { Router } from 'express';
import { qrController } from '../controllers/qrController';
import { authenticateToken } from '../middlewares/auth';
import { validateBatchId } from '../utils/validators';

const router = Router();

// Public route for QR code scanning
router.get('/scan/:batchId', validateBatchId, qrController.scanQR);

// Protected routes
router.use(authenticateToken);

router.post('/generate/:batchId', validateBatchId, qrController.generateQR);
router.get('/:batchId', validateBatchId, qrController.getQR);

export default router;