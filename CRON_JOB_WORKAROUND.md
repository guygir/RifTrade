# Cron Job Workaround for Vercel Free Tier

## Problem
Vercel's free tier has a 10-second timeout for serverless functions, but the meta data aggregation takes 30-60 seconds. This causes the cron job to fail silently.

## Solution Options

### Option 1: Use cron-job.org (Free, Recommended)
Use an external cron service that can handle longer timeouts:

1. **Sign up at https://cron-job.org** (free account)

2. **Create a new cron job:**
   - URL: `https://rif-trade.vercel.app/api/meta/refresh`
   - Schedule: Daily at 00:00 UTC
   - Method: POST
   - Headers: Add `Authorization: Bearer change_this_to_a_secure_random_string_in_production`
   - Timeout: 120 seconds (2 minutes)

3. **Benefits:**
   - Free tier supports up to 3 jobs
   - 120-second timeout (plenty of time)
   - Email notifications on failures
   - Execution history

### Option 2: Use EasyCron (Free)
Similar to cron-job.org:

1. Sign up at https://www.easycron.com
2. Create cron job with same settings as above
3. Free tier: 1 job, 60-second timeout

### Option 3: Use GitHub Actions (Free)
Use GitHub Actions as a cron service:

1. Create `.github/workflows/meta-refresh.yml`:
```yaml
name: Meta Data Refresh
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Meta Refresh
        run: |
          curl -X POST https://rif-trade.vercel.app/api/meta/refresh \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            --max-time 120
```

2. Add `CRON_SECRET` to GitHub repository secrets
3. Commit and push the workflow file

### Option 4: Upgrade to Vercel Pro ($20/month)
- 60-second timeout for serverless functions
- Cron jobs work natively
- Better for production apps

## Current Status
- Vercel cron is configured but timing out
- Data is 2 days old because cron hasn't successfully run
- Manual trigger also times out

## Recommended Action
**Use cron-job.org (Option 1)** - It's free, reliable, and takes 5 minutes to set up.

## Temporary Manual Refresh
Until you set up external cron, you can manually refresh data by running the aggregation locally:

```bash
cd /Users/guygirmonsky/Rift
npm run dev  # In one terminal
node scripts/run-aggregation.ts  # In another terminal
```

This bypasses Vercel's timeout and updates the data directly in Supabase.