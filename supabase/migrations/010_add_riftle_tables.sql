-- Migration: Add Riftle (Wordle-like Card Game) Tables
-- Created: 2026-02-17
-- Description: Creates tables for daily card puzzles, user guesses, and statistics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Daily Cards Table
-- =====================================================
-- Stores which card is the answer for each date
CREATE TABLE IF NOT EXISTS daily_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_date DATE UNIQUE NOT NULL,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_cards_date ON daily_cards(puzzle_date);
CREATE INDEX IF NOT EXISTS idx_daily_cards_card_id ON daily_cards(card_id);

-- =====================================================
-- Guesses Table
-- =====================================================
-- Stores user guesses for each puzzle
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  puzzle_id UUID NOT NULL REFERENCES daily_cards(id) ON DELETE CASCADE,
  guess_history JSONB NOT NULL DEFAULT '[]',
  guesses_used INTEGER NOT NULL DEFAULT 0,
  is_solved BOOLEAN NOT NULL DEFAULT false,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, puzzle_id)
);

CREATE INDEX IF NOT EXISTS idx_guesses_user_id ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_puzzle_id ON guesses(puzzle_id);
CREATE INDEX IF NOT EXISTS idx_guesses_submitted_at ON guesses(submitted_at);

-- =====================================================
-- User Stats Table
-- =====================================================
-- Aggregated statistics for each user
CREATE TABLE IF NOT EXISTS user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  failed_games INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_guesses DECIMAL(5,2) DEFAULT 0,
  last_played_date DATE,
  solved_distribution JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_total_score ON user_stats(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_current_streak ON user_stats(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_last_played ON user_stats(last_played_date);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE daily_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Daily Cards Policies
-- Allow anyone to view current and past puzzles (not future ones)
CREATE POLICY "Anyone can view current and past puzzles"
  ON daily_cards FOR SELECT
  USING (puzzle_date <= CURRENT_DATE);

-- Only service role can insert/update/delete daily cards
CREATE POLICY "Service role can manage daily cards"
  ON daily_cards FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Guesses Policies
-- Users can view their own guesses
CREATE POLICY "Users can view own guesses"
  ON guesses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own guesses
CREATE POLICY "Users can insert own guesses"
  ON guesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own guesses
CREATE POLICY "Users can update own guesses"
  ON guesses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can view all guesses (for leaderboard)
CREATE POLICY "Service role can view all guesses"
  ON guesses FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- User Stats Policies
-- Users can view their own stats
CREATE POLICY "Users can view own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own stats
CREATE POLICY "Users can insert own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can view all stats (for leaderboard)
CREATE POLICY "Service role can view all stats"
  ON user_stats FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE daily_cards IS 'Stores the daily puzzle card for each date';
COMMENT ON TABLE guesses IS 'Stores user guesses and game state for each puzzle';
COMMENT ON TABLE user_stats IS 'Aggregated statistics for leaderboard and user progress';

COMMENT ON COLUMN guesses.guess_history IS 'Array of guess objects with card_id, card_name, and feedback';
COMMENT ON COLUMN user_stats.solved_distribution IS 'JSONB object mapping guess count to number of wins, e.g. {"1": 5, "2": 3}';
COMMENT ON COLUMN user_stats.average_guesses IS 'Average number of guesses per solved puzzle';

-- Made with Bob