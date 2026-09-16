const jwt = require('jsonwebtoken');

/**
 * Middleware to protect routes by verifying the JWT token.
 * It extracts the token from the Authorization header, verifies it,
 * and attaches the decoded payload (userId, roleSlug, agencyId) to req.user.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }

  // Header format should be "Bearer <token>"
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token is missing' });
  }

  try {
    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Attach the decoded user information to the request object
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = {
  verifyToken
};
