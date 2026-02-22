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

