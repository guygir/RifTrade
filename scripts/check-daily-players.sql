-- Check how many players played today's Riftle puzzle
-- Note: This only counts authenticated users, not anonymous players

-- Get today's puzzle
WITH todays_puzzle AS (
  SELECT id, puzzle_date
  FROM daily_cards
  WHERE puzzle_date = CURRENT_DATE
  LIMIT 1
)

-- Count players who have guesses for today
SELECT 
  tp.puzzle_date as "Puzzle Date",
  COUNT(DISTINCT g.user_id) as "Total Players",
  COUNT(DISTINCT CASE WHEN g.is_solved = true THEN g.user_id END) as "Winners",
  COUNT(DISTINCT CASE WHEN g.is_solved = false AND g.guesses_used >= 6 THEN g.user_id END) as "Failed",
  COUNT(DISTINCT CASE WHEN g.guesses_used < 6 AND g.is_solved = false THEN g.user_id END) as "In Progress"
FROM todays_puzzle tp
LEFT JOIN guesses g ON g.puzzle_id = tp.id
GROUP BY tp.puzzle_date;

-- Show detailed player list
SELECT 
  p.display_name as "Player",
  g.is_solved as "Won?",
  g.guesses_used as "Guesses",
  g.time_taken_seconds as "Time (sec)",
  g.submitted_at as "Submitted At"
FROM todays_puzzle tp
JOIN guesses g ON g.puzzle_id = tp.id
JOIN profiles p ON p.user_id = g.user_id
ORDER BY 
  g.is_solved DESC,
  g.guesses_used ASC,
  g.time_taken_seconds ASC;

-- Alternative: Check all puzzles in the last 7 days
SELECT 
  dc.puzzle_date as "Date",
  COUNT(DISTINCT g.user_id) as "Players",
  COUNT(DISTINCT CASE WHEN g.is_solved = true THEN g.user_id END) as "Winners",
  ROUND(
    COUNT(DISTINCT CASE WHEN g.is_solved = true THEN g.user_id END)::numeric / 
    NULLIF(COUNT(DISTINCT g.user_id), 0) * 100, 
    1
  ) as "Win %"
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
WHERE dc.puzzle_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY dc.puzzle_date
ORDER BY dc.puzzle_date DESC;

-- Made with Bob
