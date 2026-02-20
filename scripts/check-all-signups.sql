-- Query to show all signed up users with signup date
-- Run this in Supabase SQL Editor

-- All users with signup date and country
SELECT 
  p.username,
  p.display_name,
  p.country,
  p.is_trading_enabled,
  p.created_at as signup_date,
  -- Also show if they've played Riftle
  COALESCE(us.total_games, 0) as riftle_games_played,
  COALESCE(us.total_score, 0) as riftle_total_score
FROM profiles p
LEFT JOIN user_stats us ON us.user_id = p.user_id
ORDER BY p.created_at DESC;

-- Summary: Count by signup date
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups_that_day
FROM profiles
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Summary: Count by country
SELECT 
  COALESCE(country, 'Unknown') as country,
  COUNT(*) as total_users,
  COUNT(CASE WHEN is_trading_enabled THEN 1 END) as trading_enabled,
  COUNT(CASE WHEN NOT is_trading_enabled THEN 1 END) as trading_disabled
FROM profiles
GROUP BY country
ORDER BY total_users DESC;

-- Users who signed up but never played Riftle
SELECT 
  p.username,
  p.display_name,
  p.country,
  p.created_at as signup_date
FROM profiles p
LEFT JOIN user_stats us ON us.user_id = p.user_id
WHERE us.total_games IS NULL OR us.total_games = 0
ORDER BY p.created_at DESC;

-- Users who signed up AND played Riftle
SELECT 
  p.username,
  p.display_name,
  p.country,
  p.created_at as signup_date,
  us.total_games,
  us.total_score,
  us.current_streak,
  us.max_streak
FROM profiles p
INNER JOIN user_stats us ON us.user_id = p.user_id
WHERE us.total_games > 0
ORDER BY us.total_score DESC;

-- Made with Bob
