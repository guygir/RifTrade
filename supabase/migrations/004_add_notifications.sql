-- Migration 004: Add notification system for matches

-- Add last_match_check timestamp to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_match_check TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create user_matches table to track matches between users
CREATE TABLE IF NOT EXISTS user_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_count INTEGER NOT NULL DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_profile_id, matched_profile_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_matches_user_profile ON user_matches(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_matched_profile ON user_matches(matched_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_is_new ON user_matches(user_profile_id, is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_user_matches_created_at ON user_matches(user_profile_id, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_matches
-- Users can read their own matches
CREATE POLICY "Users can read own matches" ON user_matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_matches.user_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can update their own matches (mark as read)
CREATE POLICY "Users can update own matches" ON user_matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_matches.user_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Users can insert their own matches (via application logic)
CREATE POLICY "Users can insert own matches" ON user_matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_matches.user_profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE TRIGGER update_user_matches_updated_at BEFORE UPDATE ON user_matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
