-- Check how many people have played Riftle
-- Run this in Supabase SQL Editor

-- 1. Total unique players (signed in)
SELECT 
  COUNT(DISTINCT user_id) as total_signed_in_players
FROM guesses;

-- 2. Players per day
SELECT 
  dc.puzzle_date,
  COUNT(DISTINCT g.user_id) as players_that_day
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
GROUP BY dc.puzzle_date
ORDER BY dc.puzzle_date DESC;

-- 3. Yesterday's players specifically
SELECT 
  dc.puzzle_date,
  COUNT(DISTINCT g.user_id) as players,
  COUNT(CASE WHEN g.is_solved THEN 1 END) as solved,
  COUNT(CASE WHEN NOT g.is_solved THEN 1 END) as failed
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
WHERE dc.puzzle_date = CURRENT_DATE - INTERVAL '1 day'
GROUP BY dc.puzzle_date;

-- 4. All players with their stats
SELECT 
  p.username,
  p.display_name,
  p.country,
  us.total_games,
  us.failed_games,
  us.current_streak,
  us.max_streak,
  us.total_score
FROM profiles p
INNER JOIN user_stats us ON us.user_id = p.user_id
WHERE us.total_games > 0
ORDER BY us.total_score DESC;

-- 5. Yesterday's leaderboard
SELECT 
  p.username,
  p.display_name,
  g.is_solved,
  g.guesses_used,
  g.time_taken_seconds,
  g.submitted_at
FROM daily_cards dc
INNER JOIN guesses g ON g.puzzle_id = dc.id
INNER JOIN profiles p ON p.user_id = g.user_id
WHERE dc.puzzle_date = CURRENT_DATE - INTERVAL '1 day'
ORDER BY 
  g.is_solved DESC,
  g.guesses_used ASC,
  g.time_taken_seconds ASC;

-- 6. Total registered users (for comparison)
SELECT COUNT(*) as total_registered_users
FROM profiles;

-- Made with Bob
