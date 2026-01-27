-- Migration: Simplify schema by removing BGG-specific fields and unused tables

-- Drop old tables
DROP TABLE IF EXISTS sync_metadata;
DROP TABLE IF EXISTS users;

-- Drop old triggers
DROP TRIGGER IF EXISTS update_games_timestamp;
DROP TRIGGER IF EXISTS update_sync_timestamp;

-- Create new simplified games table
CREATE TABLE IF NOT EXISTS games_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing game data (just names)
INSERT INTO games_new (name, created_at)
SELECT DISTINCT name, created_at
FROM games
WHERE name IS NOT NULL
ON CONFLICT(name) DO NOTHING;

-- Update plays to reference new games
-- First, create a mapping of old game IDs to new game IDs based on names
CREATE TEMPORARY TABLE game_id_mapping AS
SELECT old.id as old_id, new.id as new_id
FROM games old
JOIN games_new new ON old.name = new.name;

-- Update plays table
UPDATE plays
SET game_id = (
    SELECT new_id 
    FROM game_id_mapping 
    WHERE old_id = plays.game_id
)
WHERE game_id IN (SELECT old_id FROM game_id_mapping);

-- Drop old games table and rename new one
DROP TABLE games;
ALTER TABLE games_new RENAME TO games;

-- Recreate index
CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
