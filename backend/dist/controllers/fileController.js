"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileController = exports.FileController = void 0;
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../middlewares/errorHandler");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class FileController {
    constructor() {
        this.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
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
            logger_1.logger.info(`File uploaded: ${req.file.filename} by user ${req.user.id}`);
        });
        this.uploadMultipleFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No files uploaded'
                });
                return;
            }
            const filesInfo = req.files.map((file) => ({
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
            logger_1.logger.info(`${req.files.length} files uploaded by user ${req.user.id}`);
        });
        this.getFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { filename } = req.params;
            const filePath = path_1.default.join(__dirname, '../../uploads', filename);
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
                return;
            }
            // Get file stats
            const stats = fs_1.default.statSync(filePath);
            const fileExtension = path_1.default.extname(filename).toLowerCase();
            // Set appropriate content type
            let contentType = 'application/octet-stream';
            if (['.jpg', '.jpeg'].includes(fileExtension)) {
                contentType = 'image/jpeg';
            }
            else if (fileExtension === '.png') {
                contentType = 'image/png';
            }
            else if (fileExtension === '.pdf') {
                contentType = 'application/pdf';
            }
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stats.size);
            const fileStream = fs_1.default.createReadStream(filePath);
            fileStream.pipe(res);
        });
        this.deleteFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { filename } = req.params;
            const filePath = path_1.default.join(__dirname, '../../uploads', filename);
            // Check if file exists
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
                return;
            }
            // Delete the file
            fs_1.default.unlinkSync(filePath);
            res.status(200).json({
                success: true,
                message: 'File deleted successfully'
            });
            logger_1.logger.info(`File deleted: ${filename} by user ${req.user.id}`);
        });
    }
}
exports.FileController = FileController;
exports.fileController = new FileController();
