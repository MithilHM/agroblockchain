import { Router } from 'express';
import { walletController } from '../controllers/walletController';
import { authenticate } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all wallet routes
router.use(authenticate);

// GET /api/wallet/details - Get wallet details
router.get('/details', walletController.getWalletDetails.bind(walletController));

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', walletController.getTransactionHistory.bind(walletController));

// PUT /api/wallet/address - Update wallet address  
router.put('/address', walletController.updateWalletAddress.bind(walletController));

// GET /api/wallet/earnings - Get earnings summary
router.get('/earnings', walletController.getEarningsSummary.bind(walletController));

export { router as walletRoutes };