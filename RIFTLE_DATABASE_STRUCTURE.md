# Riftle Database Structure Explanation

## Overview
Riftle uses **3 main tables** to store all game data:

## 1. `daily_cards` Table
**Purpose:** Stores which card is the puzzle answer for each date

**Columns:**
- `id` (UUID) - Primary key
- `puzzle_date` (DATE) - The date of the puzzle (UNIQUE)
- `card_id` (UUID) - References the card from `cards` table
- `created_at` (TIMESTAMPTZ) - When the puzzle was created

**Example Data:**
```
id: 123e4567-e89b-12d3-a456-426614174000
puzzle_date: 2026-02-18
card_id: abc12345-6789-0def-1234-567890abcdef
```

**Your Data:** You have 1 row for today's puzzle (2026-02-18)

---

## 2. `guesses` Table
**Purpose:** Stores each user's game state for each puzzle

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - References auth.users (your user ID)
- `puzzle_id` (UUID) - References daily_cards.id
- `guess_history` (JSONB) - Array of all guesses with feedback
- `guesses_used` (INTEGER) - How many guesses you've made
- `is_solved` (BOOLEAN) - Whether you won
- `time_taken_seconds` (INTEGER) - How long it took
- `total_score` (INTEGER) - Points earned
- `submitted_at` (TIMESTAMPTZ) - When you finished

**Example Data:**
```json
{
  "id": "guess-uuid-1",
  "user_id": "your-user-id",
  "puzzle_id": "puzzle-uuid-for-2026-02-18",
  "guess_history": [
    {
      "card_id": "card-1-uuid",
      "card_name": "Ezreal",
      "feedback": {
        "type": "correct",
        "faction": "wrong",
        "rarity": "correct",
        "energy": "higher",
        "might": "lower",
        "power": "correct"
      }
    }
  ],
  "guesses_used": 3,
  "is_solved": true,
  "time_taken_seconds": 120,
  "total_score": 400
}
```

**Your Data:** You have **5 completed games** (5 rows in this table)
- Each row represents one puzzle you completed
- Contains all your guesses for that puzzle
- Shows whether you won or lost

**UNIQUE constraint:** One row per user per puzzle (you can't play the same puzzle twice)

---

## 3. `user_stats` Table
**Purpose:** Aggregated statistics for leaderboard and profile

**Columns:**
- `user_id` (UUID) - Primary key, references auth.users
- `total_games` (INTEGER) - Total puzzles played (your 5 games)
- `failed_games` (INTEGER) - Games you didn't solve
- `current_streak` (INTEGER) - Consecutive days played
- `max_streak` (INTEGER) - Best streak ever
- `total_score` (INTEGER) - Sum of all scores
- `average_guesses` (DECIMAL) - Average guesses per win
- `last_played_date` (DATE) - Last puzzle date
- `solved_distribution` (JSONB) - Win distribution by guess count
- `updated_at` (TIMESTAMPTZ) - Last update time

**Example Data:**
```json
{
  "user_id": "your-user-id",
  "total_games": 5,
  "failed_games": 0,
  "current_streak": 5,
  "max_streak": 5,
  "total_score": 2000,
  "average_guesses": 3.2,
  "last_played_date": "2026-02-18",
  "solved_distribution": {
    "1": 1,  // Won 1 game in 1 guess
    "2": 2,  // Won 2 games in 2 guesses
    "3": 2   // Won 2 games in 3 guesses
  }
}
```

**Your Data:** You have **1 row** in this table (one per user)
- This is where your "5 completed games" stat comes from
- Shows your overall performance across all puzzles

---

## What Happens During a Game?

### When You're Playing (Mid-Game):
**Nothing is stored in Supabase!** 
- All guesses are stored in **browser localStorage** only
- Key: `riftle_game_state`
- Contains: current guesses, start time, puzzle date

### When You Submit/Complete:
1. **`guesses` table** - New row created with:
   - All your guesses
   - Whether you won
   - Time taken
   - Score earned

2. **`user_stats` table** - Updated with:
   - Increment `total_games`
   - Update `current_streak` and `max_streak`
   - Add to `total_score`
   - Update `solved_distribution`
   - Recalculate `average_guesses`

---

## Summary for User "guygir"

### Current Data:
1. **`daily_cards`**: 1 row (today's puzzle)
2. **`guesses`**: 5 rows (your 5 completed games)
3. **`user_stats`**: 1 row (your aggregated stats showing 5 total games)

### To Clean Your Data:
We need to delete from 2 tables:
- Delete from `guesses` WHERE user_id = 'your-user-id'
- Delete from `user_stats` WHERE user_id = 'your-user-id'

**Note:** We should NOT delete from `daily_cards` - that's the puzzle itself, shared by all users!

### After Cleanup:
- Your stats will show 0 games
- You can play today's puzzle fresh
- Other users' data remains intact