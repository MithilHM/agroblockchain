"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.qrService = exports.QRService = void 0;
const db_1 = require("../config/db");
const ProduceBatch_1 = require("../models/ProduceBatch");
const env_1 = require("../config/env");
const QRCode = __importStar(require("qrcode"));
const logger_1 = require("../utils/logger");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class QRService {
    constructor() {
        this.batchRepository = db_1.AppDataSource.getRepository(ProduceBatch_1.ProduceBatch);
    }
    async generateQRCode(batch) {
        try {
            // Create QR data with batch information
            const qrData = {
                batchId: batch.batchId,
                produceType: batch.produceType,
                origin: batch.origin,
                harvestDate: batch.harvestDate,
                scanUrl: `${env_1.config.qr.baseUrl}/${batch.id}`,
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
            const filename = `qr-${batch.batchId}-${(0, uuid_1.v4)().substr(0, 8)}.png`;
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
            logger_1.logger.info(`QR code generated for batch: ${batch.batchId}`);
            return {
                url: qrCodeDataURL, // Data URL for immediate display
                data: qrString,
                filePath: qrCodeUrl // File path for permanent storage
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating QR code:', error);
            throw error;
        }
    }
    async getQRCode(batchId) {
        try {
            const batch = await this.batchRepository.findOne({
                where: { id: batchId }
            });
            return batch?.qrCodeUrl || null;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving QR code:', error);
            throw error;
        }
    }
    async validateQRData(qrString) {
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
        }
        catch (error) {
            logger_1.logger.error('Error validating QR data:', error);
            return false;
        }
    }
    // Generate simple QR code for external use (e.g., for retailers to print)
    async generateSimpleQR(batchId) {
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
        }
        catch (error) {
            logger_1.logger.error('Error generating simple QR code:', error);
            throw error;
        }
    }
}
exports.QRService = QRService;
exports.qrService = new QRService();
