"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.batchService = exports.BatchService = void 0;
const db_1 = require("../config/db");
const ProduceBatch_1 = require("../models/ProduceBatch");
const User_1 = require("../models/User");
const Auditlog_1 = require("../models/Auditlog");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
class BatchService {
    constructor() {
        this.batchRepository = db_1.AppDataSource.getRepository(ProduceBatch_1.ProduceBatch);
        this.userRepository = db_1.AppDataSource.getRepository(User_1.User);
        this.auditRepository = db_1.AppDataSource.getRepository(Auditlog_1.AuditLog);
    }
    async createBatch(batchData, farmerId) {
        try {
            const farmer = await this.userRepository.findOne({
                where: { id: farmerId }
            });
            if (!farmer) {
                throw new Error('Farmer not found');
            }
            const batch = new ProduceBatch_1.ProduceBatch();
            batch.batchId = `BATCH-${Date.now()}-${(0, uuid_1.v4)().substr(0, 8)}`;
            batch.produceType = batchData.produceType;
            batch.origin = batchData.origin;
            batch.currentPrice = batchData.currentPrice;
            batch.quantity = batchData.quantity;
            batch.unit = batchData.unit;
            batch.description = batchData.description;
            batch.harvestDate = batchData.harvestDate ? new Date(batchData.harvestDate) : new Date();
            batch.expiryDate = batchData.expiryDate ? new Date(batchData.expiryDate) : null;
            batch.currentOwner = farmer;
            batch.currentOwnerId = farmerId;
            batch.originalFarmerId = farmerId;
            batch.status = ProduceBatch_1.BatchStatus.HARVESTED;
            batch.geolocation = batchData.geolocation;
            batch.certifications = batchData.certifications;
            batch.images = batchData.images;
            const savedBatch = await this.batchRepository.save(batch);
            // Create audit log
            await this.createAuditLog(Auditlog_1.AuditAction.BATCH_CREATED, farmerId, savedBatch.id, { batchId: savedBatch.batchId, produceType: savedBatch.produceType });
            logger_1.logger.info(`Batch created: ${savedBatch.batchId} by farmer ${farmerId}`);
            return savedBatch;
        }
        catch (error) {
            logger_1.logger.error('Error creating batch:', error);
            throw error;
        }
    }
    async getBatchById(batchId) {
        try {
            const batch = await this.batchRepository.findOne({
                where: { id: batchId },
                relations: ['currentOwner', 'auditLogs']
            });
            return batch;
        }
        catch (error) {
            logger_1.logger.error('Error fetching batch:', error);
            throw error;
        }
    }
    async getBatchByBatchId(batchId) {
        try {
            const batch = await this.batchRepository.findOne({
                where: { batchId: batchId },
                relations: ['currentOwner', 'auditLogs']
            });
            return batch;
        }
        catch (error) {
            logger_1.logger.error('Error fetching batch by batchId:', error);
            throw error;
        }
    }
    async transferBatch(batchId, newOwnerId, currentUserId, price) {
        try {
            const batch = await this.getBatchById(batchId);
            if (!batch) {
                throw new Error('Batch not found');
            }
            if (batch.currentOwnerId !== currentUserId) {
                throw new Error('You are not the current owner of this batch');
            }
            const newOwner = await this.userRepository.findOne({
                where: { id: newOwnerId }
            });
            if (!newOwner) {
                throw new Error('New owner not found');
            }
            // Update batch ownership
            const previousOwnerId = batch.currentOwnerId;
            batch.currentOwner = newOwner;
            batch.currentOwnerId = newOwnerId;
            if (price) {
                batch.currentPrice = price;
            }
            // Update status based on new owner role
            switch (newOwner.role) {
                case 'distributor':
                    batch.status = ProduceBatch_1.BatchStatus.WITH_DISTRIBUTOR;
                    break;
                case 'retailer':
                    batch.status = ProduceBatch_1.BatchStatus.WITH_RETAILER;
                    break;
                default:
                    batch.status = ProduceBatch_1.BatchStatus.IN_TRANSIT;
            }
            // Add to transfer history
            batch.transferHistory.push(`${new Date().toISOString()}: ${previousOwnerId} -> ${newOwnerId}`);
            const updatedBatch = await this.batchRepository.save(batch);
            // Create audit log
            await this.createAuditLog(Auditlog_1.AuditAction.BATCH_TRANSFERRED, currentUserId, batchId, { previousOwner: previousOwnerId, newOwner: newOwnerId, price });
            logger_1.logger.info(`Batch ${batch.batchId} transferred from ${previousOwnerId} to ${newOwnerId}`);
            return updatedBatch;
        }
        catch (error) {
            logger_1.logger.error('Error transferring batch:', error);
            throw error;
        }
    }
    async updateBatchStatus(batchId, status, userId) {
        try {
            const batch = await this.getBatchById(batchId);
            if (!batch) {
                throw new Error('Batch not found');
            }
            const previousStatus = batch.status;
            batch.status = status;
            const updatedBatch = await this.batchRepository.save(batch);
            // Create audit log
            await this.createAuditLog(Auditlog_1.AuditAction.STATUS_UPDATED, userId, batchId, { previousStatus, newStatus: status });
            logger_1.logger.info(`Batch ${batch.batchId} status updated from ${previousStatus} to ${status}`);
            return updatedBatch;
        }
        catch (error) {
            logger_1.logger.error('Error updating batch status:', error);
            throw error;
        }
    }
    async getUserBatches(userId, role) {
        try {
            let batches;
            if (role === 'farmer') {
                batches = await this.batchRepository.find({
                    where: { originalFarmerId: userId },
                    relations: ['currentOwner'],
                    order: { createdAt: 'DESC' }
                });
            }
            else {
                batches = await this.batchRepository.find({
                    where: { currentOwnerId: userId },
                    relations: ['currentOwner'],
                    order: { createdAt: 'DESC' }
                });
            }
            return batches;
        }
        catch (error) {
            logger_1.logger.error('Error fetching user batches:', error);
            throw error;
        }
    }
    async getBatchHistory(batchId) {
        try {
            const auditLogs = await this.auditRepository.find({
                where: { batchId },
                relations: ['user'],
                order: { createdAt: 'ASC' }
            });
            return auditLogs;
        }
        catch (error) {
            logger_1.logger.error('Error fetching batch history:', error);
            throw error;
        }
    }
    async createAuditLog(action, userId, batchId, details) {
        try {
            const auditLog = new Auditlog_1.AuditLog();
            auditLog.action = action;
            auditLog.userId = userId;
            auditLog.batchId = batchId;
            auditLog.details = details;
            await this.auditRepository.save(auditLog);
        }
        catch (error) {
            logger_1.logger.error('Error creating audit log:', error);
        }
    }
}
exports.BatchService = BatchService;
exports.batchService = new BatchService();
