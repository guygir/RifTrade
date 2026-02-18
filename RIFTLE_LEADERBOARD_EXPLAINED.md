# Riftle Leaderboard Data Sources

## Two Types of Leaderboards

### 1. Daily Leaderboard (Today's Puzzle)
**Data Source:** `guesses` table

**Query Logic:**
```typescript
// Get today's puzzle ID from daily_cards
const puzzle = await supabase
  .from('daily_cards')
  .select('id')
  .eq('puzzle_date', '2026-02-18')
  .single();

// Get all guesses for today's puzzle
const guesses = await supabase
  .from('guesses')
  .select('user_id, is_solved, guesses_used, time_taken_seconds, submitted_at')
  .eq('puzzle_id', puzzle.id)
  .order('is_solved', { ascending: false })  // Winners first
  .order('guesses_used', { ascending: true }) // Fewer guesses = better
  .order('time_taken_seconds', { ascending: true }) // Faster = better
  .order('submitted_at', { ascending: true }) // Earlier = tiebreaker
  .limit(50);
```

**What It Shows:**
- Rank (1, 2, 3...)
- Display name (from profiles table)
- Whether they solved it (✓ or ✗)
- Number of guesses used (1-6)
- Time taken in seconds

**Sorting Priority:**
1. **Solved first** (winners before losers)
2. **Fewer guesses** (1 guess beats 2 guesses)
3. **Faster time** (120 seconds beats 180 seconds)
4. **Earlier submission** (submitted at 10:00 beats 11:00)

**Example:**
```
Rank | Name    | Solved | Guesses | Time
-----|---------|--------|---------|------
1    | Alice   | ✓      | 2       | 45s
2    | Bob     | ✓      | 2       | 67s
3    | Charlie | ✓      | 3       | 30s
4    | Dave    | ✗      | 6       | 120s
```

---

### 2. All-Time Leaderboard
**Data Source:** `user_stats` table

**Query Logic:**
```typescript
// Get user stats, ordered by requested metric
const stats = await supabase
  .from('user_stats')
  .select('user_id, total_games, failed_games, current_streak, max_streak, total_score, average_guesses')
  .gt('total_games', 0) // Only users who have played
  .order(orderBy, { ascending })
  .limit(50);
```

**Four Sorting Options:**

#### A. By Total Score (default)
```typescript
orderBy = 'total_score'
ascending = false // Higher is better
```

#### B. By Total Wins
```typescript
orderBy = 'total_games'
ascending = false // More games = more wins
```

#### C. By Win Percentage
```typescript
// Calculated: wins = total_games - failed_games
winPercent = (wins / total_games) * 100
// Then sorted by winPercent descending
```

#### D. By Average Guesses
```typescript
orderBy = 'average_guesses'
ascending = true // Lower is better (solving in fewer guesses)
```

**What It Shows:**
- Rank
- Display name
- Total games played
- Total wins
- Win percentage
- Average guesses per win
- Total score
- Current streak
- Max streak

**Example:**
```
Rank | Name    | Games | Wins | Win% | Avg Guesses | Score | Streak
-----|---------|-------|------|------|-------------|-------|-------
1    | Alice   | 100   | 95   | 95%  | 2.8         | 9500  | 15
2    | Bob     | 80    | 72   | 90%  | 3.1         | 7200  | 8
3    | Charlie | 50    | 48   | 96%  | 2.5         | 4800  | 20
```

---

## Your Current Data (User: guygir)

### In `guesses` Table:
- **1 row** = 1 completed puzzle
- Puzzle date: 2026-02-17
- Result: Failed (is_solved = false)
- Guesses used: 5
- All 5 guesses were "Yasuo, Remorseful"

### In `user_stats` Table:
- **1 row** = Your aggregated stats
- Shows "5 completed games" in the UI
- This comes from `total_games` column

**Wait, why does it show 5 games if you only have 1 row in guesses?**

Two possibilities:
1. **The stats are wrong** - Maybe the stats weren't updated correctly
2. **You played 5 different puzzles** - But only 1 is in the database now (maybe others were deleted?)

To check, run this query:
```sql
SELECT total_games, failed_games, solved_distribution 
FROM user_stats 
WHERE user_id = 'e4a18ef1-7ffb-45f6-9d70-531b94e087de';
```

---

## Summary

### Daily Leaderboard:
- **Source:** `guesses` table
- **Shows:** Today's puzzle results only
- **Sorted by:** Solved > Fewer guesses > Faster time > Earlier submission

### All-Time Leaderboard:
- **Source:** `user_stats` table
- **Shows:** Aggregated stats across all puzzles
- **Sorted by:** Total score / Total wins / Win % / Avg guesses (user choice)

### Your Stats Display:
- **Source:** `user_stats` table (your personal row)
- **Shows:** Your total games, wins, streaks, distribution
- **Updated:** Every time you complete a puzzle (via submit API)