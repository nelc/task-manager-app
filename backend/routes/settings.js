const express = require('express');
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Get all settings (public settings only for non-admins)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    const isAdmin = userResult.rows.length > 0 && userResult.rows[0].is_admin;

    let result;
    if (isAdmin) {
      result = await pool.query('SELECT * FROM settings ORDER BY key');
    } else {
      // Non-admins can only see certain settings
      const publicKeys = ['app_name', 'allow_registration'];
      result = await pool.query(
        'SELECT * FROM settings WHERE key = ANY($1) ORDER BY key',
        [publicKeys]
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific setting
router.get('/:key', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings WHERE key = $1', [req.params.key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a setting (admin only)
router.put('/:key', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { value, description } = req.body;
    const { key } = req.params;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const checkResult = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    const result = await pool.query(
      'UPDATE settings SET value = $1, description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE key = $3 RETURNING *',
      [value, description, key]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new setting (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const existingResult = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Setting already exists' });
    }

    const result = await pool.query(
      'INSERT INTO settings (key, value, description) VALUES ($1, $2, $3) RETURNING *',
      [key, value, description || '']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a setting (admin only)
router.delete('/:key', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM settings WHERE key = $1', [req.params.key]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
