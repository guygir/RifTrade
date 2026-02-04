-- Migration: Fix SFD Overnumbered Card Names and Rarity
-- Created: 2026-02-04
-- Description: Updates SFD overnumbered cards to show "(Overnumbered)" instead of "(Alternate art)"
--              and preserves their original rarity instead of "Showcase"

-- Update card names: Replace "(Alternate art)" with "(Overnumbered)"
UPDATE cards
SET name = REPLACE(name, '(Alternate art)', '(Overnumbered)')
WHERE set_code = 'SFD'
  AND metadata->'metadata'->>'overnumbered' = 'true'
  AND name LIKE '%(Alternate art)%';

-- Note: Rarity correction would require knowing the original rarity for each card
-- For now, we'll leave rarity as "Showcase" since we don't have the original data
-- If needed, this can be updated manually or by re-fetching from the source

-- Log the changes
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM cards
  WHERE set_code = 'SFD'
    AND metadata->'metadata'->>'overnumbered' = 'true'
    AND name LIKE '%(Overnumbered)%';
  
  RAISE NOTICE 'Updated % SFD overnumbered cards', updated_count;
END $$;

-- Made with Bob