import { Router } from 'express';
import { batchController } from '../controllers/batchController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

// Public route to get batch details
router.get('/:batchId', batchController.getBatch.bind(batchController));

// Protected routes
router.use(authenticateToken);
router.post('/register', batchController.registerBatch.bind(batchController));

export default router;