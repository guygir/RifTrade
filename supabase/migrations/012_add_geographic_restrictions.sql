-- Migration: Add Geographic Restrictions for Trading
-- Created: 2026-02-19
-- Description: Add country and trading permission fields to profiles

-- Add country and trading permission columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS country VARCHAR(2),
ADD COLUMN IF NOT EXISTS is_trading_enabled BOOLEAN DEFAULT true;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);
CREATE INDEX IF NOT EXISTS idx_profiles_trading_enabled ON profiles(is_trading_enabled);

-- Set existing users to Israel (IL) with trading enabled
-- This ensures current users aren't affected
UPDATE profiles
SET 
  country = 'IL',
  is_trading_enabled = true
WHERE country IS NULL;

-- Comments
COMMENT ON COLUMN profiles.country IS 'ISO 3166-1 alpha-2 country code (e.g., IL, US, GB)';
COMMENT ON COLUMN profiles.is_trading_enabled IS 'Whether user can access trading features (based on country)';

-- Made with Bob