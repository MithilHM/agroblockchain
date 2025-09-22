import { Router } from 'express';
import { batchController } from '../controllers/batchController';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { validateBatchRegistration, validateBatchTransfer, validateBatchId } from '../utils/validators';
import { UserRole } from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Batch management routes
router.post('/register', 
  requireRole([UserRole.FARMER]), 
  validateBatchRegistration, 
  batchController.registerBatch
);

router.get('/:batchId', 
  validateBatchId, 
  batchController.getBatch
);

router.put('/:batchId/transfer', 
  validateBatchId,
  validateBatchTransfer,
  batchController.transferBatch
);

router.put('/:batchId/status', 
  validateBatchId,
  batchController.updateBatchStatus
);

router.get('/', batchController.getUserBatches);

router.get('/:batchId/history', 
  validateBatchId, 
  batchController.getBatchHistory
);

export default router;