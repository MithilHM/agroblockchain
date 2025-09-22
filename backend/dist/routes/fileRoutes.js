"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fileController_1 = require("../controllers/fileController");
const auth_1 = require("../middlewares/auth");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticateToken);
// File upload routes
router.post('/upload', upload_1.upload.single('file'), fileController_1.fileController.uploadFile);
router.post('/upload-multiple', upload_1.upload.array('files', 5), fileController_1.fileController.uploadMultipleFiles);
router.get('/:filename', fileController_1.fileController.getFile);
router.delete('/:filename', fileController_1.fileController.deleteFile);
exports.default = router;
