const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/auth/login

router.post('/login', authController.login);

// POST /api/auth/register (Protected Route)
router.post('/register', verifyToken, authController.register);

module.exports = router;
