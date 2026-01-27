-- Board Game Tracker Database Schema
-- SQLite syntax for Cloudflare D1

-- Games table: stores simple game names
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on name for faster lookups
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

-- Trigger to update updated_at timestamp on plays
CREATE TRIGGER IF NOT EXISTS update_plays_timestamp
AFTER UPDATE ON plays
FOR EACH ROW
BEGIN
    UPDATE plays SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
