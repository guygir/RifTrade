-- Generate today's Riftle puzzle
-- This script selects a random card and creates a puzzle for today

-- First, delete any existing puzzle for today (in case we're regenerating)
DELETE FROM daily_cards WHERE puzzle_date = CURRENT_DATE;

-- Insert a new puzzle with a random card
-- Excludes cards used in the last 30 days
INSERT INTO daily_cards (puzzle_date, card_id)
SELECT 
  CURRENT_DATE,
  c.id
FROM cards c
WHERE c.id NOT IN (
  SELECT card_id 
  FROM daily_cards 
  WHERE puzzle_date > CURRENT_DATE - INTERVAL '30 days'
)
ORDER BY RANDOM()
LIMIT 1;

-- Show the created puzzle
SELECT 
  dc.id,
  dc.puzzle_date,
  c.name,
  c.set_code,
  c.collector_number,
  c.rarity
FROM daily_cards dc
JOIN cards c ON c.id = dc.card_id
WHERE dc.puzzle_date = CURRENT_DATE;

-- Made with Bob
