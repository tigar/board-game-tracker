-- Migration: 0001_initial
-- Description: Create initial schema for board game tracker

-- Drop existing tables if they exist (for clean slate)
DROP TABLE IF EXISTS sync_metadata;
DROP TABLE IF EXISTS plays;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS users;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_games_timestamp;
DROP TRIGGER IF EXISTS update_plays_timestamp;
DROP TRIGGER IF EXISTS update_sync_timestamp;

-- Games table: stores board game information from BGG collection export
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bgg_id INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    thumbnail_url TEXT,
    min_players INTEGER,
    max_players INTEGER,
    playing_time INTEGER,
    year_published INTEGER,
    description TEXT,
    user_rating REAL,
    bgg_rating REAL,
    complexity REAL,
    bgg_rank INTEGER,
    item_type TEXT DEFAULT 'standalone',
    recommended_players TEXT,
    best_players TEXT,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on bgg_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_games_bgg_id ON games(bgg_id);
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);

-- Plays table: stores individual game play records
CREATE TABLE IF NOT EXISTS plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL,
    played_at DATE NOT NULL,
    won BOOLEAN,
    player_count INTEGER NOT NULL,
    notes TEXT,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_plays_game_id ON plays(game_id);
CREATE INDEX IF NOT EXISTS idx_plays_played_at ON plays(played_at DESC);
CREATE INDEX IF NOT EXISTS idx_plays_created_at ON plays(created_at DESC);

-- Sync metadata table: tracks synchronization state per device
CREATE TABLE IF NOT EXISTS sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    table_name TEXT NOT NULL,
    last_sync TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, table_name)
);

CREATE INDEX IF NOT EXISTS idx_sync_device ON sync_metadata(device_id);

-- Users table: for future multi-user support
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);

-- Trigger to update updated_at timestamp on games
CREATE TRIGGER IF NOT EXISTS update_games_timestamp
AFTER UPDATE ON games
FOR EACH ROW
BEGIN
    UPDATE games SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on plays
CREATE TRIGGER IF NOT EXISTS update_plays_timestamp
AFTER UPDATE ON plays
FOR EACH ROW
BEGIN
    UPDATE plays SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to update updated_at timestamp on sync_metadata
CREATE TRIGGER IF NOT EXISTS update_sync_timestamp
AFTER UPDATE ON sync_metadata
FOR EACH ROW
BEGIN
    UPDATE sync_metadata SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
