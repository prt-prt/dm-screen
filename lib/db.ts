import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'dm-screen.db');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    -- Scenes table
    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      viewport_x REAL DEFAULT 0,
      viewport_y REAL DEFAULT 0,
      viewport_zoom REAL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Canvas nodes (modules on canvas)
    CREATE TABLE IF NOT EXISTS canvas_nodes (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      type TEXT NOT NULL,
      position_x REAL NOT NULL,
      position_y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      reference_id TEXT,
      config TEXT DEFAULT '{}',
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    -- Notes table
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Statblocks table
    CREATE TABLE IF NOT EXISTS statblocks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      size TEXT DEFAULT 'Medium',
      type TEXT DEFAULT 'Humanoid',
      alignment TEXT DEFAULT 'Unaligned',
      armor_class INTEGER DEFAULT 10,
      hit_points INTEGER DEFAULT 10,
      hit_dice TEXT DEFAULT '1d8',
      speed TEXT DEFAULT '30 ft.',
      str INTEGER DEFAULT 10,
      dex INTEGER DEFAULT 10,
      con INTEGER DEFAULT 10,
      int INTEGER DEFAULT 10,
      wis INTEGER DEFAULT 10,
      cha INTEGER DEFAULT 10,
      saving_throws TEXT,
      skills TEXT,
      damage_resistances TEXT,
      damage_immunities TEXT,
      condition_immunities TEXT,
      senses TEXT DEFAULT 'passive Perception 10',
      languages TEXT DEFAULT 'Common',
      challenge TEXT DEFAULT '0',
      traits TEXT,
      actions TEXT,
      reactions TEXT,
      legendary_actions TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audio files table
    CREATE TABLE IF NOT EXISTS audio_files (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      filename TEXT NOT NULL,
      duration REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audio scenes table
    CREATE TABLE IF NOT EXISTS audio_scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Audio scene channels (junction table)
    CREATE TABLE IF NOT EXISTS audio_scene_channels (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      audio_file_id TEXT NOT NULL,
      volume REAL DEFAULT 0.5,
      loop INTEGER DEFAULT 1,
      FOREIGN KEY (scene_id) REFERENCES audio_scenes(id) ON DELETE CASCADE,
      FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE
    );

    -- Initiative trackers table
    CREATE TABLE IF NOT EXISTS initiative_trackers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      combatants TEXT DEFAULT '[]',
      current_turn INTEGER DEFAULT 0,
      round INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Create default scene if none exists
    INSERT OR IGNORE INTO scenes (id, name) VALUES ('default', 'Main Canvas');
  `);
}

initializeDatabase();

export default db;
export { DB_PATH, DATA_DIR };
