-- Check today's vs yesterday's players
-- Run this in Supabase SQL Editor

-- Today's puzzle and players (2026-02-20)
SELECT 
  'TODAY' as period,
  dc.puzzle_date,
  dc.id as puzzle_id,
  COUNT(g.user_id) as total_players,
  COUNT(CASE WHEN g.is_solved THEN 1 END) as solved,
  COUNT(CASE WHEN g.guesses_used >= 6 THEN 1 END) as used_max_guesses
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
WHERE dc.puzzle_date = '2026-02-20'
GROUP BY dc.id, dc.puzzle_date

UNION ALL

-- Yesterday's puzzle and players (2026-02-19)
SELECT 
  'YESTERDAY' as period,
  dc.puzzle_date,
  dc.id as puzzle_id,
  COUNT(g.user_id) as total_players,
  COUNT(CASE WHEN g.is_solved THEN 1 END) as solved,
  COUNT(CASE WHEN g.guesses_used >= 6 THEN 1 END) as used_max_guesses
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
WHERE dc.puzzle_date = '2026-02-19'
GROUP BY dc.id, dc.puzzle_date;

-- Show yesterday's actual players
SELECT 
  p.username,
  p.country,
  g.is_solved,
  g.guesses_used,
  g.time_taken_seconds
FROM daily_cards dc
INNER JOIN guesses g ON g.puzzle_id = dc.id
INNER JOIN profiles p ON p.user_id = g.user_id
WHERE dc.puzzle_date = '2026-02-19'
ORDER BY g.is_solved DESC, g.guesses_used ASC, g.time_taken_seconds ASC;

-- Made with Bob
