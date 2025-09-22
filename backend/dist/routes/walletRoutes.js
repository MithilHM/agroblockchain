"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRoutes = void 0;
const express_1 = require("express");
const walletController_1 = require("../controllers/walletController");
const auth_1 = require("../middlewares/auth");
const router = (0, express_1.Router)();
exports.walletRoutes = router;
// Apply authentication middleware to all wallet routes
router.use(auth_1.authenticate);
// GET /api/wallet/details - Get wallet details
router.get('/details', walletController_1.walletController.getWalletDetails.bind(walletController_1.walletController));
// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', walletController_1.walletController.getTransactionHistory.bind(walletController_1.walletController));
// PUT /api/wallet/address - Update wallet address  
router.put('/address', walletController_1.walletController.updateWalletAddress.bind(walletController_1.walletController));
// GET /api/wallet/earnings - Get earnings summary
router.get('/earnings', walletController_1.walletController.getEarningsSummary.bind(walletController_1.walletController));
//# sourceMappingURL=walletRoutes.js.map