const jwt = require('jsonwebtoken');
const User = require('../models/User');

function extractToken(req) {
  const auth = req.headers && req.headers.authorization;
  if (!auth) return null;
  if (auth.startsWith('Bearer ')) return auth.substring(7).trim();
  return auth.trim();
}

async function protect(req, res, next) {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'JWT secret not configured' });
    }

    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
}

module.exports = { protect };