-- Debug why international players aren't showing on leaderboard
-- Run this in Supabase SQL Editor

-- 1. Check if international players have guesses saved
SELECT 
  p.username,
  p.country,
  COUNT(g.id) as total_guesses,
  COUNT(DISTINCT g.puzzle_id) as puzzles_played
FROM profiles p
LEFT JOIN guesses g ON g.user_id = p.user_id
WHERE p.country != 'IL' OR p.country IS NULL
GROUP BY p.user_id, p.username, p.country
ORDER BY total_guesses DESC;

-- 2. Check yesterday's puzzle and who played it
SELECT 
  dc.puzzle_date,
  dc.id as puzzle_id,
  COUNT(g.user_id) as players_count
FROM daily_cards dc
LEFT JOIN guesses g ON g.puzzle_id = dc.id
WHERE dc.puzzle_date = CURRENT_DATE - INTERVAL '1 day'
GROUP BY dc.id, dc.puzzle_date;

-- 3. Show ALL players from yesterday (including international)
SELECT 
  p.username,
  p.display_name,
  p.country,
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

-- 4. Check if display_name is NULL for international users
SELECT 
  p.username,
  p.display_name,
  p.country,
  CASE 
    WHEN p.display_name IS NULL THEN 'NULL - will show username'
    ELSE 'Has display_name'
  END as display_name_status
FROM profiles p
WHERE p.country != 'IL' OR p.country IS NULL;

-- 5. Check user_stats for international players
SELECT 
  p.username,
  p.country,
  us.total_games,
  us.total_score,
  us.current_streak
FROM profiles p
LEFT JOIN user_stats us ON us.user_id = p.user_id
WHERE p.country != 'IL' OR p.country IS NULL
ORDER BY us.total_games DESC NULLS LAST;

-- Made with Bob
