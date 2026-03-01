-- Migration: Add Cheat Mode support
-- Created: 2026-03-01
-- Description: Adds used_cheat flag to guesses and cheat_distribution to user_stats

-- Add used_cheat column to guesses table
ALTER TABLE guesses
  ADD COLUMN IF NOT EXISTS used_cheat BOOLEAN NOT NULL DEFAULT false;

-- Add cheat_distribution column to user_stats table
-- Mirrors solved_distribution but only counts wins where cheat mode was used
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS cheat_distribution JSONB DEFAULT '{}';

-- Add cheat_warning_seen column to user_stats table
-- Mirrors tutorial_seen_intro / tutorial_seen_feedback pattern
ALTER TABLE user_stats
  ADD COLUMN IF NOT EXISTS cheat_warning_seen BOOLEAN NOT NULL DEFAULT false;

-- Index for potential future queries on cheat usage
CREATE INDEX IF NOT EXISTS idx_guesses_used_cheat ON guesses(used_cheat);

COMMENT ON COLUMN guesses.used_cheat IS 'Whether the player had cheat mode enabled during this game';
COMMENT ON COLUMN user_stats.cheat_distribution IS 'JSONB object mapping guess count to number of cheat wins, e.g. {"1": 0, "3": 2}';
COMMENT ON COLUMN user_stats.cheat_warning_seen IS 'Whether the user has seen and acknowledged the cheat mode warning';

-- Made with Bob