const db = require('../database');

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.userId);
    
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = adminMiddleware;

