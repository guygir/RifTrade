-- SQL Query to identify cards that should be EXCLUDED from Riftle daily puzzles
-- Run this in Supabase SQL Editor to verify the exclusion criteria

-- 1. Battlefield type cards
SELECT
  'Battlefield Type' as exclusion_reason,
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity
FROM cards
WHERE metadata->'classification'->>'type' = 'Battlefield'
ORDER BY name
LIMIT 100;

-- 2. Foil cards
SELECT
  'Foil Card' as exclusion_reason,
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity,
  metadata->>'variant' as variant
FROM cards
WHERE metadata->>'variant' = 'foil'
ORDER BY name
LIMIT 100;

-- 3. Signature cards (special variants)
SELECT
  'Signature Card' as exclusion_reason,
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity,
  metadata->'metadata'->>'signature' as signature
FROM cards
WHERE metadata->'metadata'->>'signature' = 'true'
ORDER BY name;

-- Combined query: ALL cards that should be excluded
SELECT
  CASE
    WHEN metadata->'classification'->>'type' = 'Battlefield' THEN 'Battlefield Type'
    WHEN metadata->>'variant' = 'foil' THEN 'Foil Card'
    WHEN metadata->'metadata'->>'signature' = 'true' THEN 'Signature Card'
    ELSE 'Unknown'
  END as exclusion_reason,
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity,
  metadata->'attributes'->>'energy' as cost,
  metadata->'attributes'->>'might' as might,
  metadata->'attributes'->>'power' as power
FROM cards
WHERE
  metadata->'classification'->>'type' = 'Battlefield'
  OR metadata->>'variant' = 'foil'
  OR metadata->'metadata'->>'signature' = 'true'
ORDER BY exclusion_reason, name
LIMIT 100;

-- Summary count by exclusion reason
SELECT
  CASE
    WHEN metadata->'classification'->>'type' = 'Battlefield' THEN 'Battlefield Type'
    WHEN metadata->>'variant' = 'foil' THEN 'Foil Card'
    WHEN metadata->'metadata'->>'signature' = 'true' THEN 'Signature Card'
    ELSE 'Unknown'
  END as exclusion_reason,
  COUNT(*) as count
FROM cards
WHERE
  metadata->'classification'->>'type' = 'Battlefield'
  OR metadata->>'variant' = 'foil'
  OR metadata->'metadata'->>'signature' = 'true'
GROUP BY exclusion_reason
ORDER BY count DESC;

-- Total cards that will be excluded (unique count)
SELECT COUNT(DISTINCT id) as total_excluded_cards
FROM cards
WHERE
  metadata->'classification'->>'type' = 'Battlefield'
  OR metadata->>'variant' = 'foil'
  OR metadata->'metadata'->>'signature' = 'true';

-- Total cards that will be ELIGIBLE for puzzles
SELECT COUNT(*) as total_eligible_cards
FROM cards
WHERE
  metadata->'classification'->>'type' != 'Battlefield'
  AND metadata->>'variant' != 'foil'
  AND (metadata->'metadata'->>'signature' IS NULL OR metadata->'metadata'->>'signature' != 'true');

-- Sample of eligible cards (to verify they look correct)
SELECT
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity,
  metadata->'attributes'->>'energy' as cost,
  metadata->'attributes'->>'might' as might,
  metadata->'attributes'->>'power' as power
FROM cards
WHERE
  metadata->'classification'->>'type' != 'Battlefield'
  AND metadata->>'variant' != 'foil'
  AND (metadata->'metadata'->>'signature' IS NULL OR metadata->'metadata'->>'signature' != 'true')
ORDER BY RANDOM()
LIMIT 20;

-- Made with Bob
