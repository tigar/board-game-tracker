-- Migration: Simplify schema by removing unused tables and adding expansion support
-- Note: D1 doesn't support temporary tables

-- Drop old tables that aren't needed
DROP TABLE IF EXISTS sync_metadata;
DROP TABLE IF EXISTS users;

-- Drop old triggers
DROP TRIGGER IF EXISTS update_games_timestamp;
DROP TRIGGER IF EXISTS update_sync_timestamp;

-- Add expansion support columns to games table
ALTER TABLE games ADD COLUMN is_expansion INTEGER DEFAULT 0;
ALTER TABLE games ADD COLUMN parent_game_id INTEGER REFERENCES games(id);

-- Add expansion_ids column to plays table
ALTER TABLE plays ADD COLUMN expansion_ids TEXT;

-- Create indexes for expansion lookups
CREATE INDEX IF NOT EXISTS idx_games_parent_game_id ON games(parent_game_id);
CREATE INDEX IF NOT EXISTS idx_games_is_expansion ON games(is_expansion);
