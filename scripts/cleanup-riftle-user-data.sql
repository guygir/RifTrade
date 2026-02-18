-- Riftle User Data Cleanup Script
-- User: guygir
-- Purpose: Remove all Riftle game data for a specific user to start fresh

-- =====================================================
-- STEP 1: INSPECT CURRENT DATA
-- =====================================================

-- Find your user_id first
SELECT id, email, raw_user_meta_data->>'username' as username
FROM auth.users
WHERE raw_user_meta_data->>'username' = 'guygir';

-- Check your guesses (should show 5 completed games)
SELECT 
  g.id,
  g.puzzle_id,
  dc.puzzle_date,
  g.guesses_used,
  g.is_solved,
  g.time_taken_seconds,
  g.total_score,
  g.submitted_at,
  jsonb_array_length(g.guess_history) as num_guesses_in_history
FROM guesses g
JOIN daily_cards dc ON g.puzzle_id = dc.id
WHERE g.user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
)
ORDER BY g.submitted_at DESC;

-- Check your stats (should show 1 row with total_games = 5)
SELECT 
  user_id,
  total_games,
  failed_games,
  current_streak,
  max_streak,
  total_score,
  average_guesses,
  last_played_date,
  solved_distribution,
  updated_at
FROM user_stats
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
);

-- =====================================================
-- STEP 2: CLEANUP QUERIES (RUN THESE TO DELETE DATA)
-- =====================================================

-- Delete all your guesses (5 rows)
DELETE FROM guesses
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
);

-- Delete your stats (1 row)
DELETE FROM user_stats
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
);

-- =====================================================
-- STEP 3: VERIFY CLEANUP
-- =====================================================

-- Should return 0 rows
SELECT COUNT(*) as remaining_guesses
FROM guesses
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
);

-- Should return 0 rows
SELECT COUNT(*) as remaining_stats
FROM user_stats
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE raw_user_meta_data->>'username' = 'guygir'
);

-- =====================================================
-- IMPORTANT NOTES
-- =====================================================

-- 1. This does NOT delete the daily_cards table - that's shared by all users!
-- 2. This does NOT delete your user account - only Riftle game data
-- 3. After cleanup, you can play today's puzzle fresh
-- 4. Your localStorage will still have game state - clear it manually:
--    - Open browser console on /riftle page
--    - Run: localStorage.removeItem('riftle_game_state')
--    - Or just refresh the page after cleanup

-- =====================================================
-- ALTERNATIVE: DELETE BY USER_ID DIRECTLY
-- =====================================================

-- If you know your user_id, you can use it directly:
-- DELETE FROM guesses WHERE user_id = 'your-uuid-here';
-- DELETE FROM user_stats WHERE user_id = 'your-uuid-here';

-- Made with Bob
