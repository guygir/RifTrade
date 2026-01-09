# Riftbound Card Swap App – Comprehensive Project Guide

## 1. Project Overview

This project is a **lightweight, non-commercial, community card swap directory** for the *Riftbound* TCG.

The application **does not handle trades, payments, escrow, or verification**. Its sole purpose is to:

- Let users declare which cards they **have**
- Let users declare which cards they **want**
- Allow other users to **search and match** against these lists
- Expose **contact information** so users can coordinate trades *outside* the platform

The platform acts as a **bulletin board / matchmaking tool**, not a marketplace.

---

## 2. Explicit Non-Goals (Very Important)

The system must **not**:
- Process payments
- Enforce or validate trades
- Hold card ownership in escrow
- Assign or guarantee prices
- Mediate disputes
- Perform trade fairness checks

All trades happen externally between users.

---

## 3. Core Features

### 3.1 Card Database (Read-Only)

- Pre-seeded database of Riftbound cards
- Data sourced from the **Riftcodex API**
- Each card includes:
  - Unique ID
  - Name
  - Set
  - Collector number
  - Image URL
  - Rarity / classification

This card data is **static from the app’s point of view** and is only updated by re-syncing with Riftcodex.

---

### 3.2 User Profiles

Each user profile contains:
- Display name (or username)
- Contact method (Telegram handle, phone number, Discord, etc.)
- List of cards the user **has**
- List of cards the user **wants**

Users manage their own profiles.

---

### 3.3 Search & Matchmaking

The app provides a search interface that allows:

- Filtering users by cards they **have**
- Filtering users by cards they **want**
- Combined queries, such as:
  - “Users who have card X and want card Y”

The result is a list of user profiles with contact info.

No trade logic is applied.

---

## 4. Technology Stack (Recommended)

### 4.1 Frontend

- **Next.js (React)**
- **TypeScript**
- **Tailwind CSS** (optionally with shadcn/ui)

Reasons:
- Fast iteration
- Excellent support in Cursor
- Easy deployment on Vercel

---

### 4.2 Backend / API Layer

- Minimal backend
- Either:
  - Next.js API routes, or
  - Direct Supabase client usage from frontend

Responsibilities:
- Fetch and store card data during initial seeding
- Read/write user profiles
- Query matches

No complex business logic required.

---

### 4.3 Database & Auth

- **Supabase**
  - PostgreSQL database
  - Optional Supabase Auth

Reasons:
- Hosted and managed
- No server maintenance
- Built-in auth (optional)
- Easy querying for relational data

---

### 4.4 Hosting

- **Vercel**

Features:
- GitHub integration
- Free tier sufficient
- Automatic HTTPS
- Serverless backend support

Domain:
- Use default `*.vercel.app` domain initially

---

## 5. Authentication Strategy

Authentication is **optional**.

Two valid approaches:

### Option A: Auth Enabled (Recommended)
- Users sign in (email / OAuth)
- Users can edit their own profiles
- Cleaner UX

### Option B: No Auth
- Anonymous profile submissions
- No profile editing
- Faster to implement

Decision can be deferred.

---

## 6. Database Design (Conceptual)

### 6.1 Cards Table

Stores Riftbound cards synced from Riftcodex.

Key fields:
- id (UUID)
- name
- set_code
- collector_number
- image_url
- rarity
- metadata (JSON)

---

### 6.2 Profiles Table

Stores user profiles.

Key fields:
- id (UUID)
- display_name
- contact_info
- created_at

---

### 6.3 User Cards Tables

Two relational tables:

- profile_have_cards
- profile_want_cards

Each links:
- profile_id → profiles
- card_id → cards

---

## 7. External Data Source

### Riftcodex API (Primary Source)

- Used to fetch all Riftbound cards
- Provides:
  - Card metadata
  - Official image URLs
  - Stable identifiers

This API replaces scraping entirely.

Initial implementation should include:
- One-time seeding script
- Optional re-sync mechanism

---

## 8. UX Pages (Minimum Set)

1. Home / Landing
2. Card browser (read-only)
3. User profile creation/edit page
4. Search / matchmaking page

---

## 9. Development Style

- AI-assisted (Cursor)
- Vibe-coded, but:
  - Clear structure
  - Simple abstractions
  - No over-engineering

The goal is **shipping fast**, not building a platform.

---

## 10. Constraints & Assumptions

- Dataset size is small (≈300 cards)
- User count initially low
- No performance bottlenecks expected
- No monetization

---

## 11. Legal & Attribution Notes

- Riftcodex is a community API; follow its attribution requirements
- Card images remain property of Riot Games
- App must clearly state:
  - It is unofficial
  - It does not facilitate or guarantee trades

---

## 12. Desired Output From Cursor Agent

The Cursor agent should:

1. Break this guide into a **task list**
2. Propose:
   - Database schema
   - API structure
   - Page structure
3. Generate:
   - Seeding logic using Riftcodex
   - Minimal CRUD logic
   - Search queries

The agent should prioritize **simplicity and speed** over abstraction.

