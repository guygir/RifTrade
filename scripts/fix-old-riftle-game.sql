-- Option 1: Delete the old incomplete game so you can play fresh
DELETE FROM guesses 
WHERE id = 'a8bda34d-0796-4ccd-83fd-235442cff49d';

-- Option 2: Mark it as solved (if you actually won)
-- UPDATE guesses 
-- SET is_solved = true
-- WHERE id = 'a8bda34d-0796-4ccd-83fd-235442cff49d';

-- Verify it's gone/updated
SELECT 
  id,
  is_solved,
  guesses_used,
  time_taken_seconds
FROM guesses
WHERE puzzle_id = (
  SELECT id FROM daily_cards WHERE puzzle_date = '2026-02-17'
);

-- Made with Bob
