# Riftle — Wordle-like Card Guessing Game — Agent Guide

This guide instructs an agent to build **Riftle**: a daily Wordle-style game where users guess a Riftbound card by name. You already have Vercel, Supabase, and a site. The game lives at `.../riftle` on your existing site.

---

## 1. Overview

- **Theme**: Guess the card — each day one Riftbound card is the answer.
- **Data**: Your Supabase database has 700+ cards. Use them as the pool.
- **Guess mechanism**: Text input with autocomplete over all valid card names.
- **Feedback**: Per-attribute hints (see below) — either categorical (correct/wrong) or numeric (higher/lower/correct).
- **Daily rotation**: One new card per day, selected in advance.

---

## 2. Architecture (Vercel + Supabase)

| Component | Role |
|-----------|------|
| Vercel | Hosts the Next.js app; `/riftle` is a route in your site |
| Supabase | Cards data, daily puzzle selection, guesses, user stats |
| GitHub Actions | Daily cron calls your API to pick/generate the next day's puzzle |

You already have Vercel and Supabase. Add the Riftle routes under your existing app (e.g. `app/riftle/...` or a route group).

---

## 3. Database Design

### 3.1 Cards table (you already have this)

Your cards live in Supabase with 700+ rows. You’ll define which columns to use for feedback. Keep a stable `id` and `name` (or equivalent) for lookup.

### 3.2 Daily puzzles table

Stores which card is the answer for each date:

```sql
CREATE TABLE IF NOT EXISTS daily_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  puzzle_date DATE UNIQUE NOT NULL,
  card_id UUID NOT NULL REFERENCES cards(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_cards_date ON daily_cards(puzzle_date);
```

`card_id` points to your cards table. One row per date.

### 3.3 Guesses table

```sql
CREATE TABLE guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  puzzle_id UUID REFERENCES daily_cards(id) ON DELETE CASCADE NOT NULL,
  guess_history JSONB NOT NULL,
  guesses_used INTEGER NOT NULL,
  is_solved BOOLEAN NOT NULL,
  time_taken_seconds INTEGER NOT NULL,
  total_score INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, puzzle_id)
);
```

`guess_history`: array of guesses for this puzzle, e.g. `[{ "card_id": "...", "card_name": "...", "feedback": {...} }, ...]`.

### 3.4 User stats (required for stats + leaderboard)

```sql
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_games INTEGER DEFAULT 0,
  failed_games INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  average_guesses DECIMAL(5,2) DEFAULT 0,
  last_played_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- solved_distribution: {"1": 5, "2": 3, "3": 2} = 5 wins in 1 guess, 3 in 2, 2 in 3
ALTER TABLE user_stats ADD COLUMN IF NOT EXISTS solved_distribution JSONB DEFAULT '{}';
```

- **total_games** / **failed_games**: Win rate = (total_games - failed_games) / total_games.
- **solved_distribution**: JSONB `{"1": n, "2": m, ...}` = number of wins in 1 guess, 2 guesses, etc. Scales with MAX_GUESSES.
- **current_streak** / **max_streak**: Consecutive daily wins; increment on win, reset on loss or skip.
- **last_played_date**: Used for streak logic (increment only if played yesterday).
- **average_guesses**: Avg guesses per win (or including losses — define your metric).
- **total_score**: For ranking (e.g. lower guesses = better score).

RLS: Users can SELECT/INSERT/UPDATE own row.

### 3.5 User display names (leaderboard)

Use the site’s **existing** profile/user data. You already have user info (e.g. nickname, display name, email). Use that for leaderboard display — don’t create a separate profiles table for Riftle. The agent handling the main site can wire this; just read from whatever profile or user metadata the app already exposes.

---

## 4. Daily Puzzle Logic

### 4.1 `getCurrentPuzzleDate` pattern

Always serve the *most recent* puzzle whose date is on or before today. If today’s puzzle isn’t ready (cron failed), users see yesterday’s:

```ts
export async function getCurrentPuzzleDate(supabase): Promise<string | null> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_cards")
    .select("puzzle_date")
    .lte("puzzle_date", today)
    .order("puzzle_date", { ascending: false })
    .limit(1);
  const row = Array.isArray(data) ? data[0] : data;
  return row?.puzzle_date ?? null;
}
```

### 4.2 RLS policy — critical

Allow users to see puzzles on or before today (not only today):

```sql
CREATE POLICY "Anyone can view current and past puzzles"
  ON daily_cards FOR SELECT
  USING (puzzle_date <= CURRENT_DATE);
```

Otherwise, when today’s cron fails, nobody sees yesterday’s puzzle and you get “No puzzle available yet”.

---

## 5. Cron: Daily Card Selection

**Idea**: Each night the cron runs and assigns a card for **today + N** days (e.g. N=3) so you always have a small buffer.

- **Scheduled run** (no date param): pick a random card for `today + 3`.
- **Manual run** (`?date=YYYY-MM-DD`): pick a card for that specific date.

Flow:

1. Compute target date (today + 3 or from query).
2. Optionally exclude recent dates so the same card doesn’t repeat too soon.
3. Pick a random card from your 700+.
4. `DELETE` existing row for that date (if any), then `INSERT` new row.

Use a cron API route secured with `CRON_SECRET`, e.g. `/api/cron/riftle-daily`. GitHub Actions calls it:

```yaml
- cron: "30 3 * * *"  # 03:30 UTC daily
```

Use `maxDuration = 300` on that route if Vercel might timeout.

---

## 6. Guess Flow

### 6.1 Input

- Text input with **autocomplete** over all card names (from Supabase).
- Debounce and case-insensitive search.
- On submit: resolve entered text to a `card_id` (or reject if no match).

### 6.2 Submit API

Client sends: `{ puzzleId, guessedCardId, attemptNumber, timeInSeconds }` (optionally with auth).

Server:

1. Load the daily card for this puzzle.
2. Compare guessed card vs answer.
3. Compute per-attribute feedback.
4. **If signed in**: store in `guess_history`, update `guesses_used`, `is_solved`, user_stats; return feedback.
5. **If anonymous**: return feedback only; do not persist. Client stores guess history in localStorage for this session.

---

## 7. Feedback: Attributes

Each guess returns **attribute-level feedback**. You’ll choose which attributes to expose; the logic supports two kinds.

### 7.1 Categorical attributes (e.g. faction, rarity, type)

- **Match** → green (correct).
- **Mismatch** → red (wrong).

Example: guessed faction `"Shadow"`, actual `"Shadow"` → green. Guessed `"Fire"`, actual `"Shadow"` → red.

### 7.2 Numeric attributes (e.g. power, cost)

- **Higher** → blue (or orange) — “too high”.
- **Lower** → orange (or blue) — “too low”.
- **Exact** → green — correct.

Example: guessed power `5`, actual `3` → “too high”. Guessed `2`, actual `3` → “too low”.

### 7.3 Implementation sketch

```ts
type CategoricalFeedback = "correct" | "wrong";
type NumericFeedback = "exact" | "high" | "low";

function getCategoricalFeedback(guessed: string, actual: string): CategoricalFeedback {
  return guessed === actual ? "correct" : "wrong";
}

function getNumericFeedback(guessed: number, actual: number): NumericFeedback {
  if (guessed === actual) return "exact";
  return guessed > actual ? "high" : "low";
}
```

Define a config for which attributes are categorical vs numeric, then loop over them when building feedback.

---

## 8. Reference: Poker-Wordle

A similar project is **Poker-Wordle** (poker equity guessing). Useful patterns:

- **`getCurrentPuzzleDate`**: `lib/puzzle.ts` — returns most recent `puzzle_date <= today`.
- **Cron route**: `app/api/cron/generate-daily-puzzle/route.ts` — generates for date param or default (e.g. today+3).
- **Submit / feedback**: `app/api/puzzle/submit/route.ts` — compares guesses to actual, returns `feedback` per item; upserts guesses, updates user_stats (solved_distribution, streaks, scores).
- **Stats**: `app/api/stats/route.ts` — fetches user_stats + recent guesses, computes win %, avg guesses, etc.
- **Leaderboard**: `app/api/leaderboard/route.ts` — daily (from guesses) vs all-time (from user_stats); joins site’s existing user/profile data for display names; uses admin client to bypass RLS.
- **RLS**: Migration `012_puzzles_rls_allow_past.sql` — `puzzle_date <= CURRENT_DATE`.
- **GitHub workflow**: `.github/workflows/daily-puzzle.yml` — cron schedule + manual `?date=`.

Adapt these for Riftle: cards instead of hands, text+autocomplete instead of numbers, attribute feedback instead of equity feedback.

---

## 9. Stats

### 9.1 What to track

On each submit (win or loss), update `user_stats`:

- **total_games** += 1
- **failed_games** += 1 if not solved
- **solved_distribution**: increment `solved_distribution[guesses_used]` when solved
- **current_streak**: if won: +1 if last_played_date was yesterday (or no prior play), else set to 1; if lost: set to 0
- **max_streak**: max(current_streak, max_streak)
- **last_played_date**: today’s date (use UTC or local consistently)
- **total_score**: your scoring formula (e.g. sum of (MAX_GUESSES - guesses_used + 1) for wins)
- **average_guesses**: (sum of guesses_used for wins) / wins, or include losses with MAX_GUESSES — define consistently

### 9.2 Stats API

`GET /api/riftle/stats` — returns for authenticated user:

- totalGames, failedGames, winPercent
- solvedDistribution (e.g. { "1": 5, "2": 3, "3": 2 })
- currentStreak, maxStreak
- averageGuesses (with or without losses)
- totalScore
- lastPlayedDate
- recentGames: last N games (date, guessesUsed, isSolved, timeInSeconds)

---

## 10. Leaderboard

### 10.1 Daily leaderboard (today’s puzzle)

For the current puzzle date, rank users by:

1. is_solved (solved first)
2. guesses_used (fewer = better)
3. time_taken_seconds (faster = better)
4. tiebreaker: e.g. submitted_at

Returns: rank, userId, displayName (from site’s existing user/profile — nickname, username, or equivalent), isSolved, guessesUsed, timeInSeconds.

### 10.2 All-time leaderboard

Aggregate from `user_stats`. Support multiple sort modes:

- **Wins**: total_games - failed_games (desc)
- **Win %**: (wins / total_games) * 100 (desc)
- **Avg guesses**: average_guesses (asc) — fewer = better
- **Total score**: total_score (desc)

Tiebreakers: e.g. wins, then avg guesses.

### 10.3 Leaderboard API

`GET /api/riftle/leaderboard?type=daily|alltime-wins|alltime-winpct|alltime-avgguesses|alltime-score&limit=50`

Returns: entries (rank, displayName from existing user/profile, metric values), optional userRank if authenticated.

Use **service role** or a server-side client to read all users’ stats (RLS restricts users to own stats; leaderboard needs everyone).

---

## 11. Single-Page Layout

Put everything on **one page** at `/riftle`:

- **Top**: Header (title, date, auth / sign-in)
- **Main**: Game area — input, guess history, attribute feedback
- **Below game (or sidebar)**: Stats block (total games, win %, streak, recent games)
- **Below that**: Leaderboard block (tabs: Today | All Time by Wins | Win % | Avg Guesses | Score)

No separate `/riftle/stats` or `/riftle/leaderboard` routes. One scrollable page. Desktop-first; no mobile-specific adjustments needed.

---

## 12. Anonymous Play vs Signed-In

**Without sign-in**: User can play the daily puzzle. Progress (guesses, attempt count, whether played) is stored client-side only (e.g. localStorage keyed by puzzle date). No DB write. No stats, no leaderboard. If they clear cache, they could “replay” — that’s acceptable; nothing is persisted server-side.

**With sign-in**: Full experience — guesses saved in DB, stats updated, leaderboard participation. Stats and leaderboard views require auth.

---

## 13. Checklist

- [ ] `daily_cards` table + indexes.
- [ ] `guesses` table with `guess_history` JSONB.
- [ ] `user_stats` table with solved_distribution, streaks, scores.
- [ ] RLS: `puzzle_date <= CURRENT_DATE` for `daily_cards`.
- [ ] RLS: users see own guesses, own stats; leaderboard uses admin/service role.
- [ ] `getCurrentPuzzleDate` helper.
- [ ] API: `GET /api/riftle/daily` — today’s puzzle, card metadata; if signed in, include user guess state from DB; if anonymous, return puzzle only (client may restore from localStorage).
- [ ] API: `POST /api/riftle/submit` — guess, attribute feedback, update stats.
- [ ] API: `GET /api/riftle/stats` — user stats + recent games.
- [ ] API: `GET /api/riftle/leaderboard?type=...` — daily or all-time.
- [ ] API: `GET /api/cron/riftle-daily` — pick card for today+3 (or `?date=`).
- [ ] Autocomplete: fetch card names, filter by input.
- [ ] UI: single `/riftle` page — game + stats + leaderboard.
- [ ] GitHub Action calling cron endpoint with `CRON_SECRET`.
- [ ] Pre-fill buffer: manually run cron for x+1, x+2, x+3 before go-live.

---

## 14. Attributes (to be specified)

You will define which card attributes to use. For each:

- Name and type (categorical vs numeric).
- DB column (or computed field).
- Display label and sort order.

The feedback logic (categorical vs numeric) stays the same; only the attribute list changes. Poker-Wordle reference: `app/api/puzzle/submit/route.ts` (getFeedback, computePercentDiff), `components/ResultsDisplay.tsx` (attribute-style feedback rendering).
