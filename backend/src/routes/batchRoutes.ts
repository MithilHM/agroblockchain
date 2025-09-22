import { Router } from 'express';
import { batchController } from '../controllers/batchController';
import { auth } from '../middlewares/auth';

const router = Router();

// Protected routes (require authentication)
router.post('/register', auth, batchController.registerBatch);
router.post('/transfer/:batchId', auth, batchController.transferBatch);
router.get('/my-batches', auth, batchController.getUserBatches);
router.post('/generate-otp', auth, batchController.generateOTP);
router.get('/potential-buyers', auth, batchController.getPotentialBuyers);

// Public routes (for QR code scanning)
router.get('/:batchId', batchController.getBatch);

export default router;