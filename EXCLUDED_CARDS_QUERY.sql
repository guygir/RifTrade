-- SQL Query to list ALL EXCLUDED cards from Riftle daily puzzles
-- Copy and paste this into Supabase SQL Editor

SELECT 
  id,
  name,
  metadata->'classification'->>'type' as card_type,
  metadata->>'public_code' as card_number,
  metadata->'classification'->>'rarity' as rarity,
  metadata->>'variant' as variant,
  metadata->'metadata'->>'signature' as signature,
  CASE 
    WHEN metadata->'classification'->>'type' = 'Battlefield' THEN 'Battlefield'
    WHEN metadata->>'variant' = 'foil' THEN 'Foil'
    WHEN metadata->'metadata'->>'signature' = 'true' THEN 'Signature'
    ELSE 'Unknown'
  END as exclusion_reason
FROM cards
WHERE 
  metadata->'classification'->>'type' = 'Battlefield'
  OR metadata->>'variant' = 'foil'
  OR metadata->'metadata'->>'signature' = 'true'
ORDER BY exclusion_reason, name;

-- Made with Bob
