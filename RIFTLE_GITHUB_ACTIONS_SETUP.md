# Riftle GitHub Actions Setup Guide

## Overview
The daily puzzle generation is automated using GitHub Actions. The workflow runs at 3:30 AM UTC daily and generates puzzles 3 days in advance.

## Workflow File
**Location:** `.github/workflows/riftle-daily-puzzle.yml`

**Schedule:** Runs at 3:30 AM UTC every day (cron: `30 3 * * *`)

## Setup Checklist

### ✅ Already Configured
- `CRON_SECRET` exists in GitHub Secrets

### 🔧 Verify/Add These

#### 1. GitHub Secret: APP_URL
Your deployed application URL (e.g., `https://your-app.vercel.app`)

**Check if exists:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Look for `APP_URL` in the list

**If missing, add it:**
1. Click "New repository secret"
2. Name: `APP_URL`
3. Value: Your Vercel deployment URL (without trailing slash)

#### 2. Vercel Environment Variable: CRON_SECRET
The SAME value as GitHub's `CRON_SECRET`

**Check if exists:**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Look for `CRON_SECRET`

**If missing, add it:**
1. Get the value from GitHub Secrets (you'll need to regenerate if you don't have it saved)
2. Add to Vercel with the SAME value
3. Apply to: Production, Preview, Development

**If you need to regenerate CRON_SECRET:**
```bash
# Generate new secret
openssl rand -base64 32

# Update in BOTH places:
# 1. GitHub Secrets
# 2. Vercel Environment Variables
```

## Manual Trigger

You can manually trigger puzzle generation:

### Generate for Default Date (today + 3 days)
1. Go to GitHub repository → Actions
2. Select "Generate Daily Riftle Puzzle" workflow
3. Click "Run workflow"
4. Leave date field empty
5. Click "Run workflow"

### Generate for Specific Date
1. Go to GitHub repository → Actions
2. Select "Generate Daily Riftle Puzzle" workflow
3. Click "Run workflow"
4. Enter date in format: `YYYY-MM-DD` (e.g., `2026-02-20`)
5. Click "Run workflow"

## How It Works

1. **Automatic Daily Run:**
   - Runs at 3:30 AM UTC
   - Calls `/api/cron/riftle-daily` endpoint
   - Generates puzzle for 3 days from now
   - Ensures there's always a buffer of puzzles

2. **Manual Run:**
   - Can specify exact date
   - Useful for backfilling or testing
   - Same endpoint, different date parameter

3. **Puzzle Generation Logic:**
   - Selects random card not used in last 30 days
   - Stores in `daily_cards` table
   - Prevents duplicates

## Verification

After workflow runs, check:

1. **GitHub Actions Log:**
   - Should show "✅ Puzzle generated successfully"
   - Response JSON with puzzle details

2. **Database:**
   ```sql
   SELECT * FROM daily_cards 
   ORDER BY puzzle_date DESC 
   LIMIT 5;
   ```

3. **API Endpoint:**
   ```bash
   curl https://your-app.vercel.app/api/riftle/daily
   ```

## Troubleshooting

### Workflow Fails
- Check GitHub Actions logs for error details
- Verify `APP_URL` and `CRON_SECRET` are set correctly
- Ensure Vercel deployment is live

### No Puzzle Generated
- Check if card pool is exhausted (all cards used in last 30 days)
- Verify database connection
- Check Supabase logs

### Duplicate Puzzles
- Workflow has built-in duplicate prevention
- If duplicate exists, it skips and returns existing puzzle

## Configuration

To change puzzle generation settings, edit `lib/riftle/config.ts`:

```typescript
export const RIFTLE_CONFIG = {
  MAX_GUESSES: 5,              // Number of guesses allowed
  EXCLUDE_RECENT_DAYS: 30,     // Days to exclude recently used cards
  PUZZLE_BUFFER_DAYS: 3,       // Days ahead to generate (for cron)
}
```

## First-Time Setup Checklist

- [ ] Set `APP_URL` secret in GitHub
- [ ] Generate and set `CRON_SECRET` in GitHub
- [ ] Add same `CRON_SECRET` to Vercel environment variables
- [ ] Manually trigger workflow to test
- [ ] Verify puzzle appears in database
- [ ] Check that game loads puzzle correctly

## Notes

- Workflow runs automatically once set up
- No manual intervention needed after initial setup
- Generates puzzles in advance to prevent gaps
- Can manually generate puzzles for specific dates if needed