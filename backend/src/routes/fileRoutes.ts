import { Router } from 'express';
import { fileController } from '../controllers/fileController';
import { authenticateToken } from '../middlewares/auth';
import { upload } from '../middlewares/upload';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// File upload routes
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.post('/upload-multiple', upload.array('files', 5), fileController.uploadMultipleFiles);
router.get('/:filename', fileController.getFile);
router.delete('/:filename', fileController.deleteFile);

export default router;