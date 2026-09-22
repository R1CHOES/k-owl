const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, verifyTokenOptional } = require('../middleware/authMiddleware');

// POST /api/auth/login

router.post('/login', authController.login);

// POST /api/auth/register (Optionally Protected Route)
router.post('/register', verifyTokenOptional, authController.register);

module.exports = router;
