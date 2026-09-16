const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { verifyToken } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// POST /api/documents/upload
// Requires auth token, and uses multer to process single 'file' upload before controller logic
router.post('/upload', verifyToken, upload.single('file'), documentController.uploadDocument);

// GET /api/documents
// Requires auth token
router.get('/', verifyToken, documentController.getAllDocuments);

// PATCH /api/documents/:id
// Requires auth token, allows optional file upload for replacement
router.patch('/:id', verifyToken, upload.single('file'), documentController.updateDocument);

// PATCH /api/documents/:id/archive
// Requires auth token, soft deletes document
router.patch('/:id/archive', verifyToken, documentController.archiveDocument);

module.exports = router;
