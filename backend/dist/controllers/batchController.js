"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchController = exports.BatchController = void 0;
const batchService_1 = require("../services/batchService");
const ProduceBatch_1 = require("../models/ProduceBatch");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middlewares/errorHandler");
class BatchController {
    constructor() {
        this.registerBatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const batchData = req.body;
            const batch = await batchService_1.batchService.createBatch(batchData, userId);
            res.status(201).json({
                success: true,
                message: 'Batch registered successfully',
                data: {
                    batch
                }
            });
            logger_1.logger.info(`Batch registered: ${batch.batchId} by user ${userId}`);
        });
        this.getBatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const batch = await batchService_1.batchService.getBatchById(batchId);
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
        this.transferBatch = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const { newOwnerId, price } = req.body;
            const currentUserId = req.user.id;
            const batch = await batchService_1.batchService.transferBatch(batchId, newOwnerId, currentUserId, price);
            res.status(200).json({
                success: true,
                message: 'Batch transferred successfully',
                data: {
                    batch
                }
            });
            logger_1.logger.info(`Batch ${batchId} transferred to ${newOwnerId} by ${currentUserId}`);
        });
        this.updateBatchStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const { status } = req.body;
            const userId = req.user.id;
            // Validate status
            if (!Object.values(ProduceBatch_1.BatchStatus).includes(status)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid batch status'
                });
                return;
            }
            const batch = await batchService_1.batchService.updateBatchStatus(batchId, status, userId);
            res.status(200).json({
                success: true,
                message: 'Batch status updated successfully',
                data: {
                    batch
                }
            });
            logger_1.logger.info(`Batch ${batchId} status updated to ${status} by ${userId}`);
        });
        this.getUserBatches = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user.id;
            const userRole = req.user.role;
            const batches = await batchService_1.batchService.getUserBatches(userId, userRole);
            res.status(200).json({
                success: true,
                data: {
                    batches,
                    count: batches.length
                }
            });
        });
        this.getBatchHistory = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { batchId } = req.params;
            const history = await batchService_1.batchService.getBatchHistory(batchId);
            res.status(200).json({
                success: true,
                data: {
                    history
                }
            });
        });
        // Get all batches available for purchase (for distributors/retailers)
        this.getAvailableBatches = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userRole = req.user.role;
            const userId = req.user.id;
            // Logic to get batches available for purchase based on user role
            // Distributors can buy from farmers, retailers can buy from distributors
            let availableStatuses = [];
            if (userRole === 'distributor') {
                availableStatuses = [ProduceBatch_1.BatchStatus.HARVESTED];
            }
            else if (userRole === 'retailer') {
                availableStatuses = [ProduceBatch_1.BatchStatus.WITH_DISTRIBUTOR];
            }
            // This would need a more complex query to exclude own batches
            const batches = await batchService_1.batchService.getUserBatches('all', 'all'); // TODO: Implement proper available batches logic
            res.status(200).json({
                success: true,
                data: {
                    batches: batches.filter(batch => availableStatuses.includes(batch.status) &&
                        batch.currentOwnerId !== userId)
                }
            });
        });
    }
}
exports.BatchController = BatchController;
exports.batchController = new BatchController();
