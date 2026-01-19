-- Migration 005: Add tag column to profile_have_cards and profile_want_cards

-- Add tag to profile_have_cards junction table
ALTER TABLE profile_have_cards ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL;

-- Add tag to profile_want_cards junction table
ALTER TABLE profile_want_cards ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL;

-- Create index for tag filtering
CREATE INDEX IF NOT EXISTS idx_profile_have_cards_tag ON profile_have_cards(tag);
CREATE INDEX IF NOT EXISTS idx_profile_want_cards_tag ON profile_want_cards(tag);
