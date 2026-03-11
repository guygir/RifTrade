-- Query to check overnumbered cards and their naming
-- Run this in Supabase SQL Editor to verify the migration worked

-- 1. Count overnumbered cards by set
SELECT 
  set_code,
  COUNT(*) as total_overnumbered,
  COUNT(CASE WHEN name ILIKE '%(Overnumbered)%' THEN 1 END) as with_overnumbered_tag,
  COUNT(CASE WHEN name ILIKE '%(Alternate Art)%' OR name ILIKE '%(Alternate art)%' THEN 1 END) as with_alternate_art_tag
FROM cards
WHERE metadata->'metadata'->>'overnumbered' = 'true'
GROUP BY set_code
ORDER BY set_code;

-- 2. Show sample overnumbered cards from each set
SELECT 
  set_code,
  collector_number,
  name,
  rarity,
  metadata->'metadata'->>'overnumbered' as overnumbered_flag
FROM cards
WHERE metadata->'metadata'->>'overnumbered' = 'true'
ORDER BY set_code, collector_number
LIMIT 20;

-- 3. Check if any overnumbered cards still have "Alternate Art" in name (should be 0)
SELECT 
  set_code,
  collector_number,
  name
FROM cards
WHERE metadata->'metadata'->>'overnumbered' = 'true'
  AND (name ILIKE '%(Alternate Art)%' OR name ILIKE '%(Alternate art)%');

-- Made with Bob
