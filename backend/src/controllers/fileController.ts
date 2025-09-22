import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middlewares/errorHandler';
import fs from 'fs';
import path from 'path';

export class FileController {
  uploadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const fileInfo = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    };

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileInfo
    });

    logger.info(`File uploaded: ${req.file.filename} by user ${req.user!.id}`);
  });

  uploadMultipleFiles = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
      return;
    }

    const filesInfo = req.files.map((file: Express.Multer.File) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: filesInfo
    });

    logger.info(`${req.files.length} files uploaded by user ${req.user!.id}`);
  });

  getFile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    // Set appropriate content type
    let contentType = 'application/octet-stream';
    if (['.jpg', '.jpeg'].includes(fileExtension)) {
      contentType = 'image/jpeg';
    } else if (fileExtension === '.png') {
      contentType = 'image/png';
    } else if (fileExtension === '.pdf') {
      contentType = 'application/pdf';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });

  deleteFile = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      res.status(404).json({
        success: false,
        message: 'File not found'
      });
      return;
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

    logger.info(`File deleted: ${filename} by user ${req.user!.id}`);
  });
}

export const fileController = new FileController();