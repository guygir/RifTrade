-- Migration: Add Weighted Metrics to Popular Cards
-- Created: 2026-02-03
-- Description: Adds weighted usage score and percentage columns for tier-based card importance

-- =====================================================
-- Add Weighted Metrics Columns
-- =====================================================

-- Add weighted_score column (raw weighted score based on tier weights)
ALTER TABLE popular_cards 
ADD COLUMN IF NOT EXISTS weighted_score DECIMAL(10,2) DEFAULT 0;

-- Add weighted_percentage column (percentage based on max possible weighted score)
ALTER TABLE popular_cards 
ADD COLUMN IF NOT EXISTS weighted_percentage DECIMAL(5,2) DEFAULT 0;

-- =====================================================
-- Update Indexes
-- =====================================================

-- Add index for weighted percentage queries
CREATE INDEX IF NOT EXISTS idx_popular_cards_weighted_percentage 
  ON popular_cards(weighted_percentage DESC);

-- Add index for weighted score queries
CREATE INDEX IF NOT EXISTS idx_popular_cards_weighted_score 
  ON popular_cards(weighted_score DESC);

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON COLUMN popular_cards.weighted_score IS 'Tier-weighted usage score (S=32, A=16, B=8, C=4, D=2 per deck)';
COMMENT ON COLUMN popular_cards.weighted_percentage IS 'Percentage of max possible weighted score (0-100)';

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Weighted metrics columns added to popular_cards:';
  RAISE NOTICE '  - weighted_score (tier-weighted raw score)';
  RAISE NOTICE '  - weighted_percentage (percentage of max possible)';
  RAISE NOTICE 'Indexes created for weighted metrics queries.';
END $$;

-- Made with Bob