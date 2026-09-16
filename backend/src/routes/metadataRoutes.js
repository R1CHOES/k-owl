const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');

// GET /api/roles
router.get('/roles', metadataController.getRoles);

module.exports = router;
