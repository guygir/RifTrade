# Security & Open Source Considerations

## Supabase Credentials - What's Safe to Expose?

### ✅ SAFE to Commit (Public):
- **Supabase URL** (e.g., `https://xxxxx.supabase.co`)
- **Anon/Public Key** (starts with `eyJ...` or `sb_publishable_...`)

**Why?** These are designed to be public. They're used in client-side code and are visible in browser network requests. Supabase uses Row Level Security (RLS) policies to protect your data, not secret keys.

### ❌ NEVER Commit:
- **Service Role Key** - This bypasses RLS and has full database access
- **Database Password** - Direct database access credential
- **`.env.local` file** - Contains your actual credentials
- **`SUPABASE_CREDENTIALS.md`** - Contains sensitive info

## How Security Works

1. **Row Level Security (RLS)**: Your database tables have RLS policies that control who can read/write data, regardless of who has the anon key.

2. **Anon Key Limitations**: The anon key can only do what your RLS policies allow. Even if someone has it, they can't:
   - Access data they're not authorized to see
   - Modify data they don't own
   - Bypass your security rules

3. **Client-Side Exposure**: Since this is a Next.js app, the `NEXT_PUBLIC_*` environment variables are bundled into the client-side JavaScript. Anyone can see them in the browser. This is **by design** and **safe** when RLS is properly configured.

## For Open Source Projects

### Two Scenarios:

#### Scenario 1: End Users (Normal Users)
- **They just use the website** - No setup needed!
- The deployed app has your Supabase credentials baked in
- Users sign up, create profiles, search for cards - all through the UI
- They never see or need Supabase credentials
- **This is your main use case** ✅

#### Scenario 2: Developers Who Fork Your Code
- If someone wants to deploy their own instance of your app
- They would need to:
  1. Create their own Supabase project
  2. Copy `.env.example` to `.env.local`
  3. Add their own Supabase credentials
  4. Deploy to Vercel (or similar) with their own env vars
- **This is for developers, not end users**

### ✅ Good Practices:
1. **Commit `.env.example`** - Template for developers who fork
2. **Document setup** - Clear instructions in README (for developers)
3. **Use `.gitignore`** - Protect `.env.local` and credential files
4. **RLS Policies** - Ensure all tables have proper security policies
5. **Deploy with env vars** - Set credentials in Vercel dashboard (not in code)

### ❌ Don't Do:
1. **Don't commit `.env.local`** - Already in `.gitignore` ✅
2. **Don't commit `SUPABASE_CREDENTIALS.md`** - Already in `.gitignore` ✅
3. **Don't hardcode credentials** - Always use environment variables ✅

## Current Protection

This project is already configured correctly:
- ✅ `.env.local` is in `.gitignore`
- ✅ `SUPABASE_CREDENTIALS.md` is in `.gitignore`
- ✅ `.env.example` exists as a template (for developers)
- ✅ All credentials use environment variables
- ✅ RLS policies are set up in the migration

## For Your Deployed App

When you deploy to Vercel:
1. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. These will be public in the deployed app (that's fine!)
3. All end users will use your Supabase instance
4. RLS policies protect your data

## Summary

- **End users**: Just visit your website, no setup needed ✅
- **Your credentials**: Safe in `.env.local` (local) and Vercel dashboard (production) ✅
- **Open source code**: Safe to share - others can deploy their own instances ✅
- **Security**: RLS policies protect data, not secret keys ✅

