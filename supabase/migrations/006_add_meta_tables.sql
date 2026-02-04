-- Migration: Add Meta Data Tables for Popular Decks & Cards Feature
-- Created: 2026-01-30
-- Description: Creates tables to store meta snapshots, popular decks, and popular cards

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Meta Snapshots Table
-- =====================================================
-- Tracks when data was fetched from external sources
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL, -- 'riftmana', 'riftbound_tierlist', 'piltoverarchive', 'combined'
  snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL,
  data_hash TEXT, -- Hash of the data to detect changes
  metadata JSONB, -- Additional metadata about the snapshot
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Popular Decks Table
-- =====================================================
-- Stores trending/popular decks from the meta
CREATE TABLE IF NOT EXISTS popular_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID REFERENCES meta_snapshots(id) ON DELETE CASCADE,
  deck_name TEXT NOT NULL,
  deck_code TEXT, -- Deck import code if available
  champions TEXT[], -- Array of champion names (e.g., ['Jinx', 'Lux'])
  archetype TEXT, -- 'Aggro', 'Control', 'Combo', 'Midrange', etc.
  tier_rank TEXT, -- 'S', '1', '2', '3', etc.
  popularity_score INTEGER, -- Normalized score 0-100
  view_count INTEGER, -- Number of views on source site
  win_rate DECIMAL(5,2), -- Win rate percentage if available
  price_usd DECIMAL(10,2), -- Deck price in USD if available
  source_url TEXT, -- URL to original deck
  author TEXT, -- Deck creator/author
  last_updated TIMESTAMP WITH TIME ZONE, -- When deck was last updated on source
  metadata JSONB, -- Additional deck data (tags, description, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Popular Cards Table
-- =====================================================
-- Stores card usage statistics derived from popular decks
CREATE TABLE IF NOT EXISTS popular_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snapshot_id UUID REFERENCES meta_snapshots(id) ON DELETE CASCADE,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL, -- How many top decks use this card
  usage_percentage DECIMAL(5,2), -- Percentage of top decks using this card
  avg_copies DECIMAL(3,1), -- Average number of copies per deck
  tier_distribution JSONB, -- Distribution across tiers: {"S": 5, "1": 8, "2": 3, "3": 1}
  deck_archetypes JSONB, -- Which archetypes use this card: {"Aggro": 10, "Control": 5}
  metadata JSONB, -- Additional card usage data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(snapshot_id, card_id) -- One entry per card per snapshot
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Meta snapshots indexes
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_date 
  ON meta_snapshots(snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_meta_snapshots_source 
  ON meta_snapshots(source);

-- Popular decks indexes
CREATE INDEX IF NOT EXISTS idx_popular_decks_snapshot 
  ON popular_decks(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_popular_decks_tier 
  ON popular_decks(tier_rank);

CREATE INDEX IF NOT EXISTS idx_popular_decks_popularity 
  ON popular_decks(popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_popular_decks_archetype 
  ON popular_decks(archetype);

CREATE INDEX IF NOT EXISTS idx_popular_decks_champions 
  ON popular_decks USING GIN(champions);

-- Popular cards indexes
CREATE INDEX IF NOT EXISTS idx_popular_cards_snapshot 
  ON popular_cards(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_popular_cards_card 
  ON popular_cards(card_id);

CREATE INDEX IF NOT EXISTS idx_popular_cards_usage 
  ON popular_cards(usage_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_popular_cards_usage_count 
  ON popular_cards(usage_count DESC);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE meta_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_cards ENABLE ROW LEVEL SECURITY;

-- Public read access for all meta data (no authentication required)
CREATE POLICY "Public read access for meta_snapshots"
  ON meta_snapshots FOR SELECT
  USING (true);

CREATE POLICY "Public read access for popular_decks"
  ON popular_decks FOR SELECT
  USING (true);

CREATE POLICY "Public read access for popular_cards"
  ON popular_cards FOR SELECT
  USING (true);

-- Only service role can insert/update/delete (for cron jobs)
CREATE POLICY "Service role can manage meta_snapshots"
  ON meta_snapshots FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage popular_decks"
  ON popular_decks FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage popular_cards"
  ON popular_cards FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to get the latest snapshot
CREATE OR REPLACE FUNCTION get_latest_meta_snapshot()
RETURNS TABLE (
  id UUID,
  source TEXT,
  snapshot_date TIMESTAMP WITH TIME ZONE,
  age_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ms.id,
    ms.source,
    ms.snapshot_date,
    EXTRACT(EPOCH FROM (NOW() - ms.snapshot_date)) / 3600 AS age_hours
  FROM meta_snapshots ms
  WHERE ms.source = 'combined'
  ORDER BY ms.snapshot_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if meta data is stale (> 24 hours old)
CREATE OR REPLACE FUNCTION is_meta_data_stale()
RETURNS BOOLEAN AS $$
DECLARE
  latest_snapshot TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT snapshot_date INTO latest_snapshot
  FROM meta_snapshots
  WHERE source = 'combined'
  ORDER BY snapshot_date DESC
  LIMIT 1;
  
  IF latest_snapshot IS NULL THEN
    RETURN true; -- No data exists, consider stale
  END IF;
  
  RETURN (NOW() - latest_snapshot) > INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE meta_snapshots IS 'Tracks when meta data was fetched from external sources';
COMMENT ON TABLE popular_decks IS 'Stores trending and popular decks from the current meta';
COMMENT ON TABLE popular_cards IS 'Stores card usage statistics derived from popular decks';

COMMENT ON COLUMN meta_snapshots.source IS 'Data source: riftmana, riftbound_tierlist, piltoverarchive, or combined';
COMMENT ON COLUMN meta_snapshots.data_hash IS 'Hash of the data to detect if content changed';

COMMENT ON COLUMN popular_decks.tier_rank IS 'Meta tier: S (best), 1, 2, 3 (lower tiers)';
COMMENT ON COLUMN popular_decks.popularity_score IS 'Normalized popularity score from 0-100';
COMMENT ON COLUMN popular_decks.champions IS 'Array of champion names used in the deck';

COMMENT ON COLUMN popular_cards.usage_percentage IS 'Percentage of top decks that include this card';
COMMENT ON COLUMN popular_cards.tier_distribution IS 'JSON object showing usage across tiers: {"S": 5, "1": 8}';
COMMENT ON COLUMN popular_cards.deck_archetypes IS 'JSON object showing usage by archetype: {"Aggro": 10}';

-- =====================================================
-- Migration Complete
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Meta data tables created successfully:';
  RAISE NOTICE '  - meta_snapshots';
  RAISE NOTICE '  - popular_decks';
  RAISE NOTICE '  - popular_cards';
  RAISE NOTICE 'Indexes and RLS policies applied.';
  RAISE NOTICE 'Helper functions created: get_latest_meta_snapshot(), is_meta_data_stale()';
END $$;

-- Made with Bob
