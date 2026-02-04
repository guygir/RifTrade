# Environment Variables Setup Guide

## Overview
This guide explains how to get and configure all required environment variables for the Riftbound card swap app, including the new Popular Decks & Cards feature.

## Required Environment Variables

### 1. Supabase Configuration

#### NEXT_PUBLIC_SUPABASE_URL
**Where to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
**Where to get it:**
1. Same location as above (Settings → API)
2. Copy the **anon/public** key (under "Project API keys")
3. This is safe to expose in the browser

#### SUPABASE_SERVICE_ROLE_KEY
**Where to get it:**
1. Same location as above (Settings → API)
2. Copy the **service_role** key (under "Project API keys")
3. ⚠️ **IMPORTANT**: This key has admin privileges - NEVER expose it in client-side code
4. Only use it in server-side code and environment variables

### 2. Meta Data Configuration

#### META_UPDATE_ENABLED
**What it does:** Enables/disables automatic meta data updates
**Value:** `true` or `false`
**Default:** `true`

#### META_CACHE_DURATION_HOURS
**What it does:** How long to cache meta data before refreshing
**Value:** Number of hours (e.g., `24`)
**Default:** `24`

#### CRON_SECRET
**What it does:** Secret key for authenticating cron job requests to the refresh endpoint
**How to generate:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or just use any secure random string
```
**Example:** `dGhpc2lzYXNlY3VyZXJhbmRvbXN0cmluZzEyMzQ1Njc4OTA=`

## Setup Instructions

### Step 1: Create .env.local file

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Fill in Supabase values

1. Open `.env.local` in your editor
2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Meta Data Configuration
META_UPDATE_ENABLED=true
META_CACHE_DURATION_HOURS=24
CRON_SECRET=your_generated_secret_here
```

### Step 3: Generate CRON_SECRET

```bash
# Generate a secure random string
openssl rand -base64 32

# Copy the output and paste it as CRON_SECRET value
```

### Step 4: Verify setup

```bash
# Start the dev server
npm run dev

# In another terminal, test the configuration
npx tsx scripts/test-api-endpoints.ts
```

## Complete .env.local Example

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-supabase-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-supabase-dashboard

# Meta Data Configuration
META_UPDATE_ENABLED=true
META_CACHE_DURATION_HOURS=24
CRON_SECRET=generate-a-secure-random-string-for-production
```

**Note:** Replace all placeholder values with your actual keys from the Supabase dashboard (Settings → API).

## Troubleshooting

### Error: "supabaseUrl is required"
- Make sure `.env.local` exists in the project root
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set correctly
- Restart your dev server after adding environment variables

### Error: "Unauthorized" when testing refresh endpoint
- Check that `CRON_SECRET` is set in `.env.local`
- Make sure you're using the same secret in your test requests
- The test script automatically uses the secret from `.env.local`

### Error: "Missing required environment variables"
- The test script will tell you which variables are missing
- Double-check all three Supabase variables are set
- Make sure there are no typos in variable names

### Environment variables not loading
- Restart your dev server: `npm run dev`
- Make sure the file is named `.env.local` (not `.env` or `.env.development`)
- Check that the file is in the project root directory

## Security Best Practices

### ✅ DO:
- Keep `.env.local` in `.gitignore` (already configured)
- Use different values for development and production
- Rotate `CRON_SECRET` periodically
- Use Supabase RLS policies to protect data

### ❌ DON'T:
- Commit `.env.local` to version control
- Share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Use the same `CRON_SECRET` across multiple projects
- Expose service role key in client-side code

## Production Deployment (Vercel)

When deploying to Vercel, add these environment variables in the Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `META_UPDATE_ENABLED`
   - `META_CACHE_DURATION_HOURS`
   - `CRON_SECRET`

4. Make sure to select the appropriate environments (Production, Preview, Development)

## Next Steps

After setting up environment variables:

1. ✅ Run database migrations: `supabase db push`
2. ✅ Start dev server: `npm run dev`
3. ✅ Test API endpoints: `npx tsx scripts/test-api-endpoints.ts`
4. ✅ Trigger initial data fetch: See PHASE_3_COMPLETION_SUMMARY.md

## Need Help?

If you're still having issues:
1. Check that your Supabase project is active
2. Verify you have the correct project selected in Supabase dashboard
3. Make sure you've applied the database migrations
4. Check the console for specific error messages