-- Migration 003: Add username to profiles table

-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Add unique constraint on username (case-insensitive comparison)
-- We'll store lowercase usernames for consistency
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles(LOWER(username));

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Add check constraint for username format (alphanumeric, underscore, hyphen, 3-30 chars)
-- Note: PostgreSQL doesn't support regex in CHECK constraints easily, so we'll validate in application
-- But we can add a basic length constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_username_length CHECK (
  username IS NULL OR (LENGTH(username) >= 3 AND LENGTH(username) <= 30)
);

-- For existing users, we'll allow NULL username temporarily
-- They'll be required to set it on next profile update
