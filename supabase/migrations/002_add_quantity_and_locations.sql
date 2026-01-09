-- Migration 002: Add quantity, trading locations, and sort_key

-- Add sort_key to cards table (for ordering by riftbound_id middle part)
ALTER TABLE cards ADD COLUMN IF NOT EXISTS sort_key TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS public_code TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS riftbound_id TEXT;

-- Create index for sort_key
CREATE INDEX IF NOT EXISTS idx_cards_sort_key ON cards(sort_key);

-- Add trading_locations to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trading_locations TEXT;

-- Add quantity to profile_have_cards junction table
ALTER TABLE profile_have_cards ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Add quantity to profile_want_cards junction table
ALTER TABLE profile_want_cards ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- Update the unique constraint on profile_have_cards to allow same card with different quantities
-- (Actually, we want unique per profile+card, quantity is just metadata, so keep UNIQUE constraint)

-- Update the unique constraint on profile_want_cards similarly
-- (Same as above - unique per profile+card, quantity is metadata)

