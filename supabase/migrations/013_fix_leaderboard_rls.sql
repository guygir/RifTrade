-- Fix RLS policy to allow users to view all guesses for leaderboard
-- This allows the client-side leaderboard to work

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own guesses" ON guesses;

-- Create new policy: Users can view ALL guesses (for leaderboard)
CREATE POLICY "Users can view all guesses for leaderboard"
  ON guesses FOR SELECT
  USING (true);  -- Allow all authenticated and anonymous users to read

-- Note: Users can still only INSERT/UPDATE their own guesses
-- The existing policies for INSERT and UPDATE remain unchanged

-- Made with Bob