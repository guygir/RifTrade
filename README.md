# Riftbound Card Swap App

A lightweight, non-commercial community card swap directory for the Riftbound TCG.

## Setup Instructions

> **Note for End Users**: If you're just using the app, you don't need to do any setup! Just visit the website and start using it.
> 
> These instructions are for **developers** who want to run or deploy their own instance.

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier is sufficient)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key
   - Copy `.env.example` to `.env.local`: `cp .env.example .env.local`
   - Fill in your Supabase credentials in `.env.local`

3. Set up the database:
   - Run the SQL migrations in `supabase/migrations/` in your Supabase SQL editor
   - Or use the Supabase dashboard to create the tables

4. Seed the card database:
```bash
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

- `app/` - Next.js app router pages and layouts
- `components/` - Reusable React components
- `lib/` - Utility functions and Supabase client
- `scripts/` - Database seeding scripts
- `supabase/` - Database migrations and schema

## Features

- **Riftle** - Daily Riftbound card puzzle game (Wordle-style)
- Card database synced from Riftcodex API
- User profiles with have/want card lists
- Tag system for organizing cards (Important, Question, Urgent, Price)
- Search and matchmaking functionality
- Export card lists as PDF or PNG with progress tracking
- Download card lists as text files
- Simple email/password authentication
- Dark mode support
- Popular Decks & Cards with meta statistics

## Legal

This is an unofficial app. It does not facilitate or guarantee trades. All trades happen externally between users.

## Support the Project

If you enjoy using this app, consider supporting its development:

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/guygir)

<a href="https://ko-fi.com/guygir" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#92400e;color:white;font-weight:600;border-radius:8px;text-decoration:none;transition:background 0.3s;">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
  </svg>
  Buy me a cup of Ko-fi
</a>

## Changelog

### v1.1.0 (2026-02-22)
- **Riftle Enhancements:**
  - Added Champion Unit type classification (cards with `supertype: "Champion"` now display as "Champion Unit")
  - Implemented multi-domain faction matching with partial feedback (yellow color)
  - Order-independent domain matching (e.g., "Fury, Order" matches "Order, Fury")
  - Updated tutorial to explain partial match feedback
- **UI Improvements:**
  - Made daily plays chart responsive for mobile devices
  - Changed Y-axis label from "Daily Players" to "Players"
  - Removed chart title for cleaner appearance
  - Added version updates section below chart
- **Testing:**
  - Created comprehensive test suite with 11 tests covering all new features
  - All tests passed without modifying daily puzzle

### v1.0.0 (2026-02-17)
- Initial Riftle launch
- Daily card puzzle game with 6 attributes (Type, Faction, Rarity, Energy, Might, Power)
- User statistics and leaderboards
- Tutorial system for new players
- GitHub Actions cron job for daily puzzle generation
- Card database integration with Riftcodex API
- User profiles with have/want lists
- Tag system and search functionality
- PDF/PNG export with progress tracking
- Dark mode support
- Popular Decks & Cards with meta statistics

