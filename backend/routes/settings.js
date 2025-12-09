const express = require('express');
const db = require('../database');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// Get all settings (public settings only for non-admins)
router.get('/', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.userId);
    const isAdmin = user && user.is_admin === 1;

    let settings;
    if (isAdmin) {
      settings = db.prepare('SELECT * FROM settings ORDER BY key').all();
    } else {
      // Non-admins can only see certain settings
      const publicKeys = ['app_name', 'allow_registration'];
      const placeholders = publicKeys.map(() => '?').join(',');
      settings = db.prepare(`SELECT * FROM settings WHERE key IN (${placeholders}) ORDER BY key`).all(...publicKeys);
    }

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific setting
router.get('/:key', authMiddleware, (req, res) => {
  try {
    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(req.params.key);
    
    if (!setting) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json(setting);
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a setting (admin only)
router.put('/:key', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { value, description } = req.body;
    const { key } = req.params;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    
    if (!existing) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    db.prepare(
      'UPDATE settings SET value = ?, description = COALESCE(?, description), updated_at = CURRENT_TIMESTAMP WHERE key = ?'
    ).run(value, description, key);

    const updated = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    res.json(updated);
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new setting (admin only)
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: 'Key and value are required' });
    }

    const existing = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    if (existing) {
      return res.status(400).json({ error: 'Setting already exists' });
    }

    db.prepare('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)').run(key, value, description || '');

    const setting = db.prepare('SELECT * FROM settings WHERE key = ?').get(key);
    res.status(201).json(setting);
  } catch (error) {
    console.error('Create setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a setting (admin only)
router.delete('/:key', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM settings WHERE key = ?').run(req.params.key);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

