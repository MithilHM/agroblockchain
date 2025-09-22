import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { batchService } from '../services/batchService';
import { BatchStatus } from '../models/ProduceBatch';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middlewares/errorHandler';

export class BatchController {
  registerBatch = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const batchData = req.body;

    const batch = await batchService.createBatch(batchData, userId);

    res.status(201).json({
      success: true,
      message: 'Batch registered successfully',
      data: {
        batch
      }
    });

    logger.info(`Batch registered: ${batch.batchId} by user ${userId}`);
  });

  getBatch = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;

    const batch = await batchService.getBatchById(batchId);

    if (!batch) {
      res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        batch
      }
    });
  });

  transferBatch = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const { newOwnerId, price } = req.body;
    const currentUserId = req.user!.id;

    const batch = await batchService.transferBatch(batchId, newOwnerId, currentUserId, price);

    res.status(200).json({
      success: true,
      message: 'Batch transferred successfully',
      data: {
        batch
      }
    });

    logger.info(`Batch ${batchId} transferred to ${newOwnerId} by ${currentUserId}`);
  });

  updateBatchStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const { status } = req.body;
    const userId = req.user!.id;

    // Validate status
    if (!Object.values(BatchStatus).includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid batch status'
      });
      return;
    }

    const batch = await batchService.updateBatchStatus(batchId, status, userId);

    res.status(200).json({
      success: true,
      message: 'Batch status updated successfully',
      data: {
        batch
      }
    });

    logger.info(`Batch ${batchId} status updated to ${status} by ${userId}`);
  });

  getUserBatches = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const batches = await batchService.getUserBatches(userId, userRole);

    res.status(200).json({
      success: true,
      data: {
        batches,
        count: batches.length
      }
    });
  });

  getBatchHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;

    const history = await batchService.getBatchHistory(batchId);

    res.status(200).json({
      success: true,
      data: {
        history
      }
    });
  });

  // Get all batches available for purchase (for distributors/retailers)
  getAvailableBatches = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userRole = req.user!.role;
    const userId = req.user!.id;

    // Logic to get batches available for purchase based on user role
    // Distributors can buy from farmers, retailers can buy from distributors
    let availableStatuses: BatchStatus[] = [];
    
    if (userRole === 'distributor') {
      availableStatuses = [BatchStatus.HARVESTED];
    } else if (userRole === 'retailer') {
      availableStatuses = [BatchStatus.WITH_DISTRIBUTOR];
    }

    // This would need a more complex query to exclude own batches
    const batches = await batchService.getUserBatches('all', 'all'); // TODO: Implement proper available batches logic

    res.status(200).json({
      success: true,
      data: {
        batches: batches.filter(batch => 
          availableStatuses.includes(batch.status) && 
          batch.currentOwnerId !== userId
        )
      }
    });
  });
}

export const batchController = new BatchController();