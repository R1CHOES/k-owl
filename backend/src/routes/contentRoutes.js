const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/content/:id/versions
router.post('/:id/versions', verifyToken, contentController.saveContentVersion);

// PATCH /api/content/:id/data
router.patch('/:id/data', verifyToken, contentController.updateContentData);

module.exports = router;
