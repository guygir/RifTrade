-- Generate a test puzzle for today
-- Run this ENTIRE script in Supabase SQL Editor (select all, then run)

-- Step 1: Delete any existing puzzle for today
DELETE FROM daily_cards WHERE puzzle_date = CURRENT_DATE;

-- Step 2: Insert a random card as today's puzzle (includes ALL cards)
INSERT INTO daily_cards (puzzle_date, card_id)
SELECT
  CURRENT_DATE,
  id
FROM cards
ORDER BY RANDOM()
LIMIT 1;

-- Step 3: Verify the puzzle was created
SELECT
  dc.id as puzzle_id,
  dc.puzzle_date,
  c.name as card_name,
  c.set_code,
  c.collector_number,
  c.rarity
FROM daily_cards dc
JOIN cards c ON dc.card_id = c.id
WHERE dc.puzzle_date = CURRENT_DATE;

-- Made with Bob
