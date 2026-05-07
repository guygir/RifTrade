-- Enable RLS on cards table and allow public read access
-- This ensures all cards (including UNL) are visible to everyone

-- Enable Row Level Security on cards table
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all cards
CREATE POLICY "Cards are viewable by everyone" ON cards
  FOR SELECT USING (true);

-- Allow service role to manage cards (for seeding)
CREATE POLICY "Service role can manage cards" ON cards
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Made with Bob
