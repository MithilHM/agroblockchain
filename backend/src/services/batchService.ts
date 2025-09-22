import { AppDataSource } from '../config/db';
import { ProduceBatch, BatchStatus } from '../models/ProduceBatch';
import { User } from '../models/User';
import { AuditLog, AuditAction } from '../models/AuditLog';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export class BatchService {
  private batchRepository = AppDataSource.getRepository(ProduceBatch);
  private userRepository = AppDataSource.getRepository(User);
  private auditRepository = AppDataSource.getRepository(AuditLog);

  async createBatch(batchData: any, farmerId: string): Promise<ProduceBatch> {
    try {
      const farmer = await this.userRepository.findOne({
        where: { id: farmerId }
      });

      if (!farmer) {
        throw new Error('Farmer not found');
      }

      const batch = new ProduceBatch();
      batch.batchId = `BATCH-${Date.now()}-${uuidv4().substr(0, 8)}`;
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
      batch.status = BatchStatus.HARVESTED;
      batch.geolocation = batchData.geolocation;
      batch.certifications = batchData.certifications;
      batch.images = batchData.images;

      const savedBatch = await this.batchRepository.save(batch);

      // Create audit log
      await this.createAuditLog(
        AuditAction.BATCH_CREATED,
        farmerId,
        savedBatch.id,
        { batchId: savedBatch.batchId, produceType: savedBatch.produceType }
      );

      logger.info(`Batch created: ${savedBatch.batchId} by farmer ${farmerId}`);
      return savedBatch;
    } catch (error) {
      logger.error('Error creating batch:', error);
      throw error;
    }
  }

  async getBatchById(batchId: string): Promise<ProduceBatch | null> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { id: batchId },
        relations: ['currentOwner', 'auditLogs']
      });
      return batch;
    } catch (error) {
      logger.error('Error fetching batch:', error);
      throw error;
    }
  }

  async getBatchByBatchId(batchId: string): Promise<ProduceBatch | null> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { batchId: batchId },
        relations: ['currentOwner', 'auditLogs']
      });
      return batch;
    } catch (error) {
      logger.error('Error fetching batch by batchId:', error);
      throw error;
    }
  }

  async transferBatch(batchId: string, newOwnerId: string, currentUserId: string, price?: number): Promise<ProduceBatch> {
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
          batch.status = BatchStatus.WITH_DISTRIBUTOR;
          break;
        case 'retailer':
          batch.status = BatchStatus.WITH_RETAILER;
          break;
        default:
          batch.status = BatchStatus.IN_TRANSIT;
      }

      // Add to transfer history
      batch.transferHistory.push(`${new Date().toISOString()}: ${previousOwnerId} -> ${newOwnerId}`);

      const updatedBatch = await this.batchRepository.save(batch);

      // Create audit log
      await this.createAuditLog(
        AuditAction.BATCH_TRANSFERRED,
        currentUserId,
        batchId,
        { previousOwner: previousOwnerId, newOwner: newOwnerId, price }
      );

      logger.info(`Batch ${batch.batchId} transferred from ${previousOwnerId} to ${newOwnerId}`);
      return updatedBatch;
    } catch (error) {
      logger.error('Error transferring batch:', error);
      throw error;
    }
  }

  async updateBatchStatus(batchId: string, status: BatchStatus, userId: string): Promise<ProduceBatch> {
    try {
      const batch = await this.getBatchById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      const previousStatus = batch.status;
      batch.status = status;

      const updatedBatch = await this.batchRepository.save(batch);

      // Create audit log
      await this.createAuditLog(
        AuditAction.STATUS_UPDATED,
        userId,
        batchId,
        { previousStatus, newStatus: status }
      );

      logger.info(`Batch ${batch.batchId} status updated from ${previousStatus} to ${status}`);
      return updatedBatch;
    } catch (error) {
      logger.error('Error updating batch status:', error);
      throw error;
    }
  }

  async getUserBatches(userId: string, role: string): Promise<ProduceBatch[]> {
    try {
      let batches: ProduceBatch[];

      if (role === 'farmer') {
        batches = await this.batchRepository.find({
          where: { originalFarmerId: userId },
          relations: ['currentOwner'],
          order: { createdAt: 'DESC' }
        });
      } else {
        batches = await this.batchRepository.find({
          where: { currentOwnerId: userId },
          relations: ['currentOwner'],
          order: { createdAt: 'DESC' }
        });
      }

      return batches;
    } catch (error) {
      logger.error('Error fetching user batches:', error);
      throw error;
    }
  }

  async getBatchHistory(batchId: string): Promise<AuditLog[]> {
    try {
      const auditLogs = await this.auditRepository.find({
        where: { batchId },
        relations: ['user'],
        order: { createdAt: 'ASC' }
      });
      return auditLogs;
    } catch (error) {
      logger.error('Error fetching batch history:', error);
      throw error;
    }
  }

  private async createAuditLog(action: AuditAction, userId: string, batchId: string, details: any): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.action = action;
      auditLog.userId = userId;
      auditLog.batchId = batchId;
      auditLog.details = details;

      await this.auditRepository.save(auditLog);
    } catch (error) {
      logger.error('Error creating audit log:', error);
    }
  }
}

export const batchService = new BatchService();