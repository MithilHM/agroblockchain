"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrController = exports.QRController = void 0;
const qrService_1 = require("../services/qrService");
const batchService_1 = require("../services/batchService");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middlewares/errorHandler");
class QRController {
    constructor() {
        this.generateQR = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const userId = req.user.id;
            // Check if batch exists and user owns it
            const batch = await batchService_1.batchService.getBatchById(batchId);
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
            const qrData = await qrService_1.qrService.generateQRCode(batch);
            res.status(200).json({
                success: true,
                message: 'QR code generated successfully',
                data: {
                    qrCodeUrl: qrData.url,
                    qrCodeData: qrData.data
                }
            });
            logger_1.logger.info(`QR code generated for batch ${batch.batchId} by user ${userId}`);
        });
        this.getQR = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const batch = await batchService_1.batchService.getBatchById(batchId);
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
        this.scanQR = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            // Try to find by batch ID first (UUID), then by batchId (readable ID)
            let batch = await batchService_1.batchService.getBatchById(batchId);
            if (!batch) {
                batch = await batchService_1.batchService.getBatchByBatchId(batchId);
            }
            if (!batch) {
                res.status(404).json({
                    success: false,
                    message: 'Batch not found'
                });
                return;
            }
            // Get batch history for traceability
            const history = await batchService_1.batchService.getBatchHistory(batch.id);
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
            logger_1.logger.info(`QR code scanned for batch ${batch.batchId}`);
        });
    }
}
exports.QRController = QRController;
exports.qrController = new QRController();
