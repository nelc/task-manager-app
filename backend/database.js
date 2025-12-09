const Database = require('better-sqlite3');
const path = require('path');
const url = require('url');

// Parse DATABASE_URL or use local file
let dbPath;
if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL (format: sqlite:///path/to/db.sqlite or file:/path/to/db.sqlite)
  const parsed = url.parse(process.env.DATABASE_URL);
  if (parsed.protocol === 'sqlite:' || parsed.protocol === 'file:') {
    dbPath = parsed.pathname || parsed.path;
    // Remove leading slash for relative paths
    if (dbPath.startsWith('///')) {
      dbPath = dbPath.substring(3);
    } else if (dbPath.startsWith('//')) {
      dbPath = dbPath.substring(2);
    }
  } else {
    dbPath = process.env.DATABASE_URL.replace('sqlite://', '').replace('file://', '');
  }
} else {
  dbPath = path.join(__dirname, 'data', 'tasks.db');
}

// Ensure directory exists
const fs = require('fs');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
`);

// Initialize default settings
const initSettings = db.prepare(`
  INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)
`);

const defaultSettings = [
  ['app_name', 'Task Manager', 'Application name'],
  ['max_tasks_per_user', '1000', 'Maximum tasks per user'],
  ['session_timeout', '7', 'Session timeout in days'],
  ['allow_registration', 'true', 'Allow new user registration']
];

defaultSettings.forEach(([key, value, description]) => {
  initSettings.run(key, value, description);
});

console.log(`Database initialized at: ${dbPath}`);

module.exports = db;

