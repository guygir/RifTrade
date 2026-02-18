# Riftle Setup and Testing Guide

## Answers to Your Questions

### 1. App URL and CRON_SECRET

**CRON_SECRET**: You already have it in `.env.local`!
```env
CRON_SECRET=change_this_to_a_secure_random_string_in_production
```

**APP_URL**: Based on your Vercel deployment, it should be something like:
- Production: `https://rift-[your-project-id].vercel.app` or your custom domain
- You can find this in your Vercel dashboard

**For GitHub Secrets**: Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
- Name: `APP_URL`, Value: `https://your-app-url.vercel.app`
- Name: `CRON_SECRET`, Value: `change_this_to_a_secure_random_string_in_production` (same as .env.local)

### 2. Generating Puzzles

**Option A: Use GitHub Actions Manual Trigger** (Recommended)
1. Go to your GitHub repo → Actions tab
2. Select "Generate Daily Riftle Puzzle" workflow
3. Click "Run workflow"
4. Enter dates manually:
   - Leave empty for default (today + 3)
   - Or enter specific date: `2026-02-17`
5. Run it 4 times for today through today+3

**Option B: Use Vercel Deployment URL**
Once deployed, you can call the API directly:
```bash
# Generate for today
curl -X GET "https://your-app.vercel.app/api/cron/riftle-daily" \
  -H "Authorization: Bearer change_this_to_a_secure_random_string_in_production"

# Generate for specific date
curl -X GET "https://your-app.vercel.app/api/cron/riftle-daily?date=2026-02-18" \
  -H "Authorization: Bearer change_this_to_a_secure_random_string_in_production"
```

### 3. Testing on Localhost

**YES! You can and should test locally first.**

## Complete Local Testing Guide

### Step 1: Apply Supabase Migration

The migration file already exists at `supabase/migrations/010_add_riftle_tables.sql`.

**Apply it via Supabase Dashboard**:
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Click "New query"
5. Copy the entire contents of `supabase/migrations/010_add_riftle_tables.sql`
6. Paste and click "Run"
7. Verify tables created: Go to Table Editor and check for:
   - `daily_cards`
   - `guesses`
   - `user_stats`

**Or apply via Supabase CLI** (if you have it installed):
```bash
supabase db push
```

### Step 2: Start Local Development Server

```bash
npm run dev
```

The app should start at `http://localhost:3000`

### Step 3: Generate Test Puzzle for Today

**Option A: Use the API endpoint directly**
```bash
# In a new terminal, while dev server is running:
curl -X GET "http://localhost:3000/api/cron/riftle-daily" \
  -H "Authorization: Bearer change_this_to_a_secure_random_string_in_production" \
  | json_pp
```

**Option B: Use the script** (if Node.js/npm is available):
```bash
npx tsx scripts/generate-riftle-puzzle.ts
```

**Option C: Use Supabase SQL Editor directly**:
```sql
-- Insert a test puzzle for today
INSERT INTO daily_cards (puzzle_date, card_id)
SELECT 
  CURRENT_DATE,
  id
FROM cards
WHERE name NOT ILIKE '%(Foil)%'
  AND name NOT ILIKE '%(Alternate art)%'
  AND name NOT ILIKE '%(Overnumbered)%'
ORDER BY RANDOM()
LIMIT 1;

-- Verify it was created
SELECT dc.puzzle_date, c.name, c.set_code, c.collector_number
FROM daily_cards dc
JOIN cards c ON dc.card_id = c.id
WHERE dc.puzzle_date = CURRENT_DATE;
```

### Step 4: Test the Game

1. **Visit the game**: http://localhost:3000/riftle

2. **Test anonymous play**:
   - Type a card name in the search box
   - Select a card from autocomplete
   - Click "Submit Guess"
   - Verify feedback appears with colored attributes
   - Try to guess the correct card

3. **Test authenticated play**:
   - Sign in to your app (use existing auth)
   - Play the game
   - Verify stats appear below the game
   - Check leaderboard updates

### Step 5: Test API Endpoints

```bash
# Test daily puzzle endpoint
curl http://localhost:3000/api/riftle/daily | json_pp

# Test card autocomplete
curl "http://localhost:3000/api/riftle/cards?q=dragon" | json_pp

# Test leaderboard (should work even without data)
curl "http://localhost:3000/api/riftle/leaderboard?type=daily" | json_pp

# Test stats (requires authentication - will return 401 if not logged in)
curl http://localhost:3000/api/riftle/stats | json_pp
```

### Step 6: Verify Database

Check Supabase Table Editor:

**daily_cards table**:
- Should have 1 row for today
- `puzzle_date` = today's date
- `card_id` = valid card UUID

**guesses table** (after playing):
- Should have your guess records
- `guess_history` = JSON array of guesses
- `is_solved` = true/false

**user_stats table** (after completing a game):
- Should have your stats
- `total_games` incremented
- `solved_distribution` updated

## Troubleshooting

### Issue: "No puzzle available yet"
**Solution**: Generate a puzzle for today using one of the methods in Step 3

### Issue: "Authentication required" when submitting guess
**Solution**: 
- Anonymous play stores in localStorage only
- For full features, sign in to your app first
- Check that Supabase auth is working

### Issue: Cards not appearing in autocomplete
**Solution**: 
- Verify cards exist in database: `SELECT COUNT(*) FROM cards;`
- Check that cards were seeded properly
- Try searching for a common card name like "Ezreal"

### Issue: TypeScript errors
**Solution**: 
- Run `npm install` to ensure all dependencies are installed
- Check that all files were created correctly

### Issue: Leaderboard shows no entries
**Solution**: 
- This is normal if no one has played yet
- Play a game while signed in
- Refresh the page to see your entry

## Production Deployment Checklist

Once local testing is complete:

- [ ] Commit all changes to Git
- [ ] Push to GitHub
- [ ] Vercel will auto-deploy
- [ ] Apply migration to production Supabase (if not auto-applied)
- [ ] Set GitHub Secrets (APP_URL, CRON_SECRET)
- [ ] Generate initial puzzles via GitHub Actions or API
- [ ] Test production URL
- [ ] Verify cron job runs (check next day)

## Quick Test Script

Here's a complete test sequence:

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, generate puzzle
curl -X GET "http://localhost:3000/api/cron/riftle-daily" \
  -H "Authorization: Bearer change_this_to_a_secure_random_string_in_production"

# 3. Test endpoints
curl http://localhost:3000/api/riftle/daily
curl "http://localhost:3000/api/riftle/cards?q=a"
curl "http://localhost:3000/api/riftle/leaderboard?type=daily"

# 4. Open browser
open http://localhost:3000/riftle
```

## What to Expect

### First Visit (Anonymous)
- Game loads with input box
- Can search and select cards
- Can submit guesses
- See feedback with colored attributes
- Stats section hidden (not signed in)
- Leaderboard shows "No entries yet"

### After Signing In
- Same game experience
- Stats section appears below game
- Progress saved to database
- Appears on leaderboard after completing game
- Can only play once per day

### After Completing Game
- Game over message appears
- Answer revealed (if lost) or congratulations (if won)
- Stats update immediately
- Leaderboard updates on refresh
- Input disabled until next day

## Need Help?

If you encounter issues:
1. Check browser console for errors
2. Check terminal for API errors
3. Check Supabase logs in dashboard
4. Verify migration was applied correctly
5. Ensure .env.local has all required variables

---

**Ready to test!** Start with Step 1 (apply migration) and work through each step. 🚀