import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { qrService } from '../services/qrService';
import { batchService } from '../services/batchService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middlewares/errorHandler';

export class QRController {
  generateQR = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;
    const userId = req.user!.id;

    // Check if batch exists and user owns it
    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
      return;
    }

    // Check ownership (farmers can generate QR for their batches, current owners can regenerate)
    if (batch.originalFarmerId !== userId && batch.currentOwnerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You are not authorized to generate QR for this batch'
      });
      return;
    }

    const qrData = await qrService.generateQRCode(batch);

    res.status(200).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCodeUrl: qrData.url,
        qrCodeData: qrData.data
      }
    });

    logger.info(`QR code generated for batch ${batch.batchId} by user ${userId}`);
  });

  getQR = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { batchId } = req.params;

    const batch = await batchService.getBatchById(batchId);
    if (!batch) {
      res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
      return;
    }

    if (!batch.qrCodeUrl) {
      res.status(404).json({
        success: false,
        message: 'QR code not found for this batch'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        qrCodeUrl: batch.qrCodeUrl,
        batch: {
          id: batch.id,
          batchId: batch.batchId,
          produceType: batch.produceType,
          status: batch.status
        }
      }
    });
  });

  // Public endpoint for scanning QR codes
  scanQR = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { batchId } = req.params;

    // Try to find by batch ID first (UUID), then by batchId (readable ID)
    let batch = await batchService.getBatchById(batchId);
    
    if (!batch) {
      batch = await batchService.getBatchByBatchId(batchId);
    }

    if (!batch) {
      res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
      return;
    }

    // Get batch history for traceability
    const history = await batchService.getBatchHistory(batch.id);

    // Return comprehensive batch information for traceability
    const traceabilityData = {
      batch: {
        id: batch.id,
        batchId: batch.batchId,
        produceType: batch.produceType,
        origin: batch.origin,
        status: batch.status,
        currentPrice: batch.currentPrice,
        quantity: batch.quantity,
        unit: batch.unit,
        description: batch.description,
        harvestDate: batch.harvestDate,
        expiryDate: batch.expiryDate,
        geolocation: batch.geolocation,
        certifications: batch.certifications,
        images: batch.images,
        createdAt: batch.createdAt
      },
      currentOwner: {
        id: batch.currentOwner.id,
        name: batch.currentOwner.name,
        role: batch.currentOwner.role,
        address: batch.currentOwner.address
      },
      traceability: {
        originalFarmer: batch.originalFarmerId,
        transferHistory: batch.transferHistory,
        timeline: history.map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          details: log.details,
          user: log.user ? {
            name: log.user.name,
            role: log.user.role
          } : null
        }))
      }
    };

    res.status(200).json({
      success: true,
      message: 'Batch information retrieved successfully',
      data: traceabilityData
    });

    logger.info(`QR code scanned for batch ${batch.batchId}`);
  });
}

export const qrController = new QRController();