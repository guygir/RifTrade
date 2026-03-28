-- Migration: Add Overnumbered Rarity Poll
-- Created: 2026-03-28
-- Description: Adds a new poll about whether Overnumbered should be a separate rarity

-- Deactivate the old "Set as category" poll (now implemented in v1.4)
UPDATE polls 
SET is_active = false, updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- Insert the new "Overnumbered rarity" poll
INSERT INTO polls (id, question, options, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Should Overnumbered cards have their own rarity category?',
  '["No, keep them as Alternate Art", "Yes, separate Overnumbered from Alternate Art", "No preference"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Made with Bob