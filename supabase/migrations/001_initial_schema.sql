-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cards table (read-only, synced from Riftcodex)
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  set_code TEXT NOT NULL,
  collector_number TEXT NOT NULL,
  image_url TEXT,
  rarity TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(set_code, collector_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  contact_info TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Profile have cards junction table
CREATE TABLE IF NOT EXISTS profile_have_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, card_id)
);

-- Profile want cards junction table
CREATE TABLE IF NOT EXISTS profile_want_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, card_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_have_cards_profile ON profile_have_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_have_cards_card ON profile_have_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_profile_want_cards_profile ON profile_want_cards(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_want_cards_card ON profile_want_cards(card_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_have_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_want_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can read all profiles
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profile_have_cards
CREATE POLICY "Profile have cards are viewable by everyone" ON profile_have_cards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own have cards" ON profile_have_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_have_cards.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- RLS Policies for profile_want_cards
CREATE POLICY "Profile want cards are viewable by everyone" ON profile_want_cards
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own want cards" ON profile_want_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_want_cards.profile_id
      AND profiles.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

