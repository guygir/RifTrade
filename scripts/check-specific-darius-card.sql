-- Check the specific Darius card from SFD #236
SELECT 
  id,
  name,
  set_code,
  collector_number,
  rarity,
  metadata->'metadata'->>'overnumbered' as overnumbered_flag,
  metadata->'metadata'->>'alternate_art' as alternate_art_flag
FROM cards
WHERE set_code = 'SFD'
  AND collector_number = '236';

-- Made with Bob
