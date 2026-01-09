# Supabase Setup Instructions

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in (free account is sufficient)
3. Click "New Project"
4. Fill in:
   - **Name**: Riftbound Card Swap (or any name you prefer)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
5. Click "Create new project"
6. Wait for the project to be set up (takes 1-2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: Copy this (looks like `https://xxxxx.supabase.co`)
   - **anon/public key**: Copy this (long string starting with `eyJ...`)

## Step 3: Set Up Environment Variables

1. In your project root, create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI4MCwiZXhwIjoxOTU0NTQzMjgwfQ.example_key_here
```

## Step 4: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Step 5: Configure Email Auth (Optional)

**Note**: Email auth is usually **enabled by default** in Supabase. This step is mainly about email verification settings.

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Click on **Email** provider
3. **Email auth is already enabled** - you can use email + password right away!
4. **Optional settings**:
   - **Disable email confirmation** (if you want users to sign up without verifying email):
     - Go to **Authentication** → **Settings**
     - Under "Email Auth", toggle "Enable email confirmations" to OFF
     - This lets users sign up and immediately use the app (no email verification needed)
   - **Email templates**: Customize the verification emails if desired (defaults work fine)

**What this means**:
- ✅ Users sign up with **email + password** (not username)
- ✅ If email confirmation is ON: Users must verify email before using the app
- ✅ If email confirmation is OFF: Users can use the app immediately after signup
- ✅ You can skip this step entirely - email auth works by default!

## Step 6: Verify Setup

1. In Supabase dashboard, go to **Table Editor**
2. You should see these tables:
   - `cards`
   - `profiles`
   - `profile_have_cards`
   - `profile_want_cards`

## Troubleshooting

- **Can't find API keys?** Make sure you're in Settings → API, not Settings → General
- **Migration errors?** Make sure you're running the SQL in the SQL Editor, not the Table Editor
- **Auth not working?** 
  - Email provider is enabled by default, but check **Authentication** → **Providers** → **Email** to confirm
  - If users can't sign in after signup, check if email confirmation is required in **Authentication** → **Settings**

## Next Steps

Once Supabase is set up:
1. Run `npm install` to install dependencies
2. Run `npm run seed` to populate the cards database (after Riftcodex API is configured)
3. Run `npm run dev` to start the development server

