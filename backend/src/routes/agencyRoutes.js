const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/agencies - Public for registration drop-downs
router.get('/', agencyController.getAllAgencies);

// POST /api/agencies
router.post('/', verifyToken, agencyController.createAgency);

// PATCH /api/agencies/:id
router.patch('/:id', verifyToken, agencyController.updateAgency);

module.exports = router;
