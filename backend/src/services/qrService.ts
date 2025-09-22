import { AppDataSource } from '../config/db';
import { ProduceBatch } from '../models/ProduceBatch';
import { config } from '../config/env';
import QRCode from 'qrcode';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class QRService {
  private batchRepository;

  constructor() {
    this.batchRepository = AppDataSource.getRepository(ProduceBatch);
  }

  async generateQRCode(batch: ProduceBatch): Promise<{ url: string; data: string; filePath?: string }> {
    try {
      // Create QR data with batch information
      const qrData = {
        batchId: batch.batchId,
        produceType: batch.produceType,
        origin: batch.origin,
        harvestDate: batch.harvestDate,
        scanUrl: `${config.qr.baseUrl}/${batch.id}`,
        verificationUrl: `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/qr/scan/${batch.id}`
      };

      const qrString = JSON.stringify(qrData);
      
      // Generate QR code as data URL for immediate response
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Also save as file for better storage
      const uploadsDir = path.join(__dirname, '../../uploads/qr-codes');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `qr-${batch.batchId}-${uuidv4().substr(0, 8)}.png`;
      const filePath = path.join(uploadsDir, filename);

      // Save QR code as PNG file
      await QRCode.toFile(filePath, qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      // Update batch with QR code URL (store file path for serving)
      const qrCodeUrl = `/uploads/qr-codes/${filename}`;
      batch.qrCodeUrl = qrCodeUrl;
      await this.batchRepository.save(batch);

      logger.info(`QR code generated for batch: ${batch.batchId}`);
      
      return {
        url: qrCodeDataURL, // Data URL for immediate display
        data: qrString,
        filePath: qrCodeUrl // File path for permanent storage
      };
    } catch (error) {
      logger.error('Error generating QR code:', error);
      throw error;
    }
  }

  async getQRCode(batchId: string): Promise<string | null> {
    try {
      const batch = await this.batchRepository.findOne({
        where: { id: batchId }
      });

      return batch?.qrCodeUrl || null;
    } catch (error) {
      logger.error('Error retrieving QR code:', error);
      throw error;
    }
  }

  async validateQRData(qrString: string): Promise<boolean> {
    try {
      const qrData = JSON.parse(qrString);
      
      // Basic validation
      if (!qrData.batchId || !qrData.produceType || !qrData.origin) {
        return false;
      }

      // Check if batch exists
      const batch = await this.batchRepository.findOne({
        where: { batchId: qrData.batchId }
      });

      return !!batch;
    } catch (error) {
      logger.error('Error validating QR data:', error);
      return false;
    }
  }

  // Generate simple QR code for external use (e.g., for retailers to print)
  async generateSimpleQR(batchId: string): Promise<string> {
    try {
      const scanUrl = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/qr/scan/${batchId}`;
      
      const qrCodeDataURL = await QRCode.toDataURL(scanUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'L'
      });

      return qrCodeDataURL;
    } catch (error) {
      logger.error('Error generating simple QR code:', error);
      throw error;
    }
  }
}

export const qrService = new QRService();