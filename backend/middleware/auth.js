const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await db.query(
      'SELECT id, phone, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account suspended' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Check role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
};

// Optional auth (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await db.query('SELECT id, phone, full_name, role FROM users WHERE id = $1', [decoded.userId]);
      req.user = result.rows[0] || null;
    }
  } catch {
    req.user = null;
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuth };
