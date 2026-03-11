-- Migration: Fix Overnumbered Card Names (All Sets)
-- Created: 2026-03-11
-- Description: Updates ALL overnumbered cards (any set) to show "(Overnumbered)" instead of "(Alternate Art)"
--              Uses the metadata.overnumbered flag to identify cards correctly
--              This fixes both existing SFD cards and prevents future issues with new sets

-- First, let's see what we're dealing with
DO $$
DECLARE
  alt_art_count INTEGER;
  overnumbered_count INTEGER;
  total_showcase INTEGER;
BEGIN
  -- Count Showcase cards with overnumbered flag that have "(Alternate Art)" or "(Alternate art)"
  SELECT COUNT(*) INTO alt_art_count
  FROM cards
  WHERE metadata->'metadata'->>'overnumbered' = 'true'
    AND (name ILIKE '%(Alternate Art)%' OR name ILIKE '%(Alternate art)%');
  
  -- Count cards already with "(Overnumbered)"
  SELECT COUNT(*) INTO overnumbered_count
  FROM cards
  WHERE metadata->'metadata'->>'overnumbered' = 'true'
    AND name ILIKE '%(Overnumbered)%';
  
  -- Count total Showcase cards with overnumbered flag
  SELECT COUNT(*) INTO total_showcase
  FROM cards
  WHERE metadata->'metadata'->>'overnumbered' = 'true';
  
  RAISE NOTICE 'Overnumbered cards with Alternate Art: %', alt_art_count;
  RAISE NOTICE 'Overnumbered cards already with Overnumbered: %', overnumbered_count;
  RAISE NOTICE 'Total overnumbered cards: %', total_showcase;
END $$;

-- Update card names: Replace both variations of "Alternate Art" with "Overnumbered"
-- Only for cards that have the overnumbered flag in metadata
-- Case-insensitive replacement
UPDATE cards
SET name = REGEXP_REPLACE(name, '\(Alternate [Aa]rt\)', '(Overnumbered)', 'gi')
WHERE metadata->'metadata'->>'overnumbered' = 'true'
  AND (name ILIKE '%(Alternate Art)%' OR name ILIKE '%(Alternate art)%');

-- Log the final state
DO $$
DECLARE
  total_overnumbered INTEGER;
  by_set RECORD;
BEGIN
  SELECT COUNT(*) INTO total_overnumbered
  FROM cards
  WHERE metadata->'metadata'->>'overnumbered' = 'true';
  
  RAISE NOTICE 'Total overnumbered cards after fix: %', total_overnumbered;
  RAISE NOTICE 'All should now have (Overnumbered) in their name';
  RAISE NOTICE '';
  RAISE NOTICE 'Breakdown by set:';
  
  FOR by_set IN
    SELECT set_code, COUNT(*) as count
    FROM cards
    WHERE metadata->'metadata'->>'overnumbered' = 'true'
    GROUP BY set_code
    ORDER BY set_code
  LOOP
    RAISE NOTICE '  %: % cards', by_set.set_code, by_set.count;
  END LOOP;
END $$;

-- Made with Bob