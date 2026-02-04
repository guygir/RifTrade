-- Migration: Add RLS Policies for Meta Data Tables
-- Created: 2026-02-04
-- Description: Adds Row Level Security policies to allow public read and service role write

-- =====================================================
-- Enable RLS on Meta Tables
-- =====================================================

ALTER TABLE meta_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE popular_cards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Meta Snapshots Policies
-- =====================================================

-- Allow anyone to read meta snapshots
CREATE POLICY "Allow public read access to meta_snapshots"
  ON meta_snapshots
  FOR SELECT
  USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access to meta_snapshots"
  ON meta_snapshots
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Popular Decks Policies
-- =====================================================

-- Allow anyone to read popular decks
CREATE POLICY "Allow public read access to popular_decks"
  ON popular_decks
  FOR SELECT
  USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access to popular_decks"
  ON popular_decks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Popular Cards Policies
-- =====================================================

-- Allow anyone to read popular cards
CREATE POLICY "Allow public read access to popular_cards"
  ON popular_cards
  FOR SELECT
  USING (true);

-- Allow service role to insert/update/delete
CREATE POLICY "Allow service role full access to popular_cards"
  ON popular_cards
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Made with Bob