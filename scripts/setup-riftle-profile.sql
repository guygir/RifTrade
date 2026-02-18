-- Setup profile for Riftle leaderboard
-- Run this in Supabase SQL Editor while logged in

-- Check if profile exists
SELECT id, display_name FROM profiles WHERE id = auth.uid();

-- If no profile exists, create one
INSERT INTO profiles (id, display_name)
VALUES (auth.uid(), 'Player')
ON CONFLICT (id) DO UPDATE
SET display_name = COALESCE(profiles.display_name, 'Player');

-- Verify profile was created
SELECT id, display_name FROM profiles WHERE id = auth.uid();

-- Made with Bob
