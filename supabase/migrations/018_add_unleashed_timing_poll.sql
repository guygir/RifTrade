-- Migration: Add Unleashed Set Timing Poll
-- Created: 2026-04-25
-- Description: Adds a new poll about when Unleashed (UNL) cards should be added to Riftle

-- Deactivate the old "Overnumbered rarity" poll
UPDATE polls 
SET is_active = false, updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002'::uuid;

-- Insert the new "Unleashed timing" poll
INSERT INTO polls (id, question, options, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'When should Unleashed (UNL) cards be included in Riftle daily puzzles?',
  '["As soon as possible", "At official release date", "Some time after release"]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;

-- Made with Bob