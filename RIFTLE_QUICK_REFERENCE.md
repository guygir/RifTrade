# Riftle Quick Reference Guide

## Fixed Issues ✅

### Issue 1: SQL Error When Re-running
**Problem**: Getting syntax error when running the SQL script multiple times
**Solution**: Select ALL the SQL code before clicking "Run" in Supabase SQL Editor. Don't run line by line.

### Issue 2: Card Variants Excluded
**Problem**: Foil, Alternate art, and Overnumbered cards were excluded
**Solution**: Updated to include ALL cards in the pool. Now any card can be the daily puzzle!

## How to Generate a Puzzle (3 Methods)

### Method 1: Supabase SQL Editor (Easiest) ⭐
1. Open Supabase Dashboard → SQL Editor
2. Copy **ALL** of `scripts/generate-test-puzzle.sql`
3. **Select all the text** (Ctrl+A / Cmd+A)
4. Click "Run"
5. See the selected card in the results

**To replace today's puzzle**: Just run it again! The DELETE statement removes the old one first.

### Method 2: GitHub Actions (For Production)
1. Go to GitHub repo → Actions tab
2. Click "Generate Daily Riftle Puzzle"
3. Click "Run workflow"
4. Enter date (optional) or leave empty for today+3
5. Click "Run workflow" button

### Method 3: API Call (Advanced)
```bash
curl -X GET "https://your-app.vercel.app/api/cron/riftle-daily" \
  -H "Authorization: Bearer change_this_to_a_secure_random_string_in_production"
```

## Testing Checklist

- [x] Apply migration (`010_add_riftle_tables.sql`)
- [x] Generate puzzle for today (use Method 1 above)
- [ ] Start dev server: `npm run dev`
- [ ] Visit: http://localhost:3000/riftle
- [ ] Test autocomplete (type any card name)
- [ ] Submit a guess
- [ ] Verify feedback appears with colors
- [ ] Try to win the game!

## Understanding the Feedback Colors

### Categorical Attributes (Correct/Wrong)
- 🟢 **Green** = Correct match
- 🔴 **Red** = Wrong

Applies to:
- Name (exact match wins!)
- Set (OGN, SFD, BFD)
- Rarity (Common, Rare, etc.)
- Type (Unit, Spell, Rune)
- Faction (card color/faction)

### Numeric Attributes (High/Low/Exact)
- 🟢 **Green** = Exact match
- 🟠 **Orange** = Your guess is too high (↓)
- 🔵 **Blue** = Your guess is too low (↑)

Applies to:
- Cost (mana cost)
- Power (attack value)
- Health (toughness)

## Common Issues & Solutions

### "No puzzle available yet"
**Solution**: Generate a puzzle using Method 1 above

### Cards not showing in autocomplete
**Solution**: 
- Check cards exist: `SELECT COUNT(*) FROM cards;` in Supabase
- Try searching for common names like "Ezreal" or "Dragon"

### Can't submit guess
**Solution**: 
- Make sure you selected a card from the dropdown
- Check browser console for errors

### Stats not showing
**Solution**: 
- Stats only show for authenticated users
- Sign in to your app first
- Play and complete a game

### Leaderboard empty
**Solution**: 
- Normal if no one has played yet
- Complete a game while signed in
- Refresh the page

## Card Pool

**Total Cards**: All cards in your database (~700+)
**Includes**: 
- ✅ Base cards
- ✅ Foil variants
- ✅ Alternate art
- ✅ Overnumbered cards
- ✅ All sets (OGN, SFD, BFD, etc.)

**Exclusion**: Only recently used cards (last 30 days) are excluded to avoid repetition

## Database Tables

### daily_cards
- Stores which card is the puzzle for each date
- One row per date
- Links to cards table

### guesses
- Stores user game state
- One row per user per puzzle
- Contains guess history as JSON

### user_stats
- Aggregated statistics
- One row per user
- Updated after each completed game

## Quick SQL Queries

### Check today's puzzle
```sql
SELECT dc.puzzle_date, c.name, c.set_code, c.collector_number
FROM daily_cards dc
JOIN cards c ON dc.card_id = c.id
WHERE dc.puzzle_date = CURRENT_DATE;
```

### Check all puzzles
```sql
SELECT dc.puzzle_date, c.name
FROM daily_cards dc
JOIN cards c ON dc.card_id = c.id
ORDER BY dc.puzzle_date DESC;
```

### Check your stats
```sql
SELECT * FROM user_stats 
WHERE user_id = 'your-user-id';
```

### Check recent games
```sql
SELECT g.guesses_used, g.is_solved, dc.puzzle_date
FROM guesses g
JOIN daily_cards dc ON g.puzzle_id = dc.id
ORDER BY g.submitted_at DESC
LIMIT 10;
```

## API Endpoints

### GET /api/riftle/daily
Returns current puzzle (without answer)

### POST /api/riftle/submit
Submit a guess (requires auth)
```json
{
  "puzzleId": "uuid",
  "guessedCardId": "uuid",
  "attemptNumber": 1,
  "timeInSeconds": 45
}
```

### GET /api/riftle/stats
Get user statistics (requires auth)

### GET /api/riftle/leaderboard?type=daily
Get leaderboard
- `type=daily` - Today's puzzle
- `type=alltime-wins` - Most wins
- `type=alltime-winpct` - Best win %
- `type=alltime-avgguesses` - Lowest avg guesses
- `type=alltime-score` - Highest score

### GET /api/riftle/cards?q=dragon
Search cards for autocomplete

### GET /api/cron/riftle-daily
Generate puzzle (requires CRON_SECRET header)

## Environment Variables

Already configured in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CRON_SECRET=change_this_to_a_secure_random_string_in_production
```

## GitHub Secrets Needed

For automated daily puzzles:
- `APP_URL` - Your Vercel deployment URL
- `CRON_SECRET` - Same value as in .env.local

## Game Rules

- **Max Guesses**: 6 attempts
- **Scoring**: (6 - guesses + 1) points for wins
- **Streak**: Consecutive daily wins
- **One puzzle per day**: Can only play once per day (if authenticated)
- **Anonymous play**: Can play without signing in (progress in localStorage only)

## Next Steps

1. ✅ Apply migration
2. ✅ Generate puzzle (Method 1)
3. ⏳ Test locally (`npm run dev`)
4. ⏳ Deploy to production
5. ⏳ Set GitHub secrets
6. ⏳ Test production URL

---

**Need help?** Check `RIFTLE_SETUP_AND_TESTING.md` for detailed instructions.