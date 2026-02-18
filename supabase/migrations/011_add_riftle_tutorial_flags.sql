-- Migration: Add Riftle Tutorial Flags
-- Created: 2026-02-18
-- Description: Add flags to track if user has seen tutorial steps

-- Add tutorial flags to user_stats table
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS tutorial_seen_intro BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tutorial_seen_feedback BOOLEAN DEFAULT false;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_tutorial ON user_stats(user_id, tutorial_seen_intro, tutorial_seen_feedback);

-- Comments
COMMENT ON COLUMN user_stats.tutorial_seen_intro IS 'Whether user has seen the initial tutorial explaining the game';
COMMENT ON COLUMN user_stats.tutorial_seen_feedback IS 'Whether user has seen the feedback explanation after first guess';

-- Made with Bob