const jwt = require('jsonwebtoken');
const { getSetting } = require('../database');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const jwtSecret = await getSetting('jwt_secret', process.env.JWT_SECRET || 'fallback-secret-please-change-in-settings');
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
