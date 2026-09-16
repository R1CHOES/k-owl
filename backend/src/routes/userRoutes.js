const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users
router.get('/', verifyToken, userController.getAllUsers);

// PATCH /api/users/:id/status
router.patch('/:id/status', verifyToken, userController.toggleUserStatus);

// PATCH /api/users/:id
router.patch('/:id', verifyToken, userController.updateUser);

module.exports = router;
