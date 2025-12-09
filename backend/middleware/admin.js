const { pool } = require('../database');

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = adminMiddleware;
