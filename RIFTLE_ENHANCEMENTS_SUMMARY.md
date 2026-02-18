# Riftle Enhancements Summary

## Changes Implemented

### 1. ✅ Max Guesses Changed to 6
**File:** `lib/riftle/config.ts`
- Changed `MAX_GUESSES` from 5 to 6
- Stats distribution updated to include guess #6
- All game logic automatically adapts (configurable design)

### 2. ✅ Guess Number Labels Added
**File:** `app/riftle/page.tsx`
- Each guess now shows "Guess #1:", "Guess #2:", etc.
- Labels appear before the card name
- Makes it clear which guess is which in the history

### 3. ✅ Card Image Display on Game Over
**File:** `app/riftle/page.tsx`
- When game ends (win or loss), the answer card's image is displayed
- Uses Next.js Image component for optimization
- Same image display logic as Cards page
- Shows card name, set code, collector number, and rarity below image

### 4. ✅ Stats and Leaderboard Side-by-Side
**File:** `app/riftle/page.tsx`
- Changed from stacked layout to grid layout
- Desktop: 2 columns (stats left, leaderboard right)
- Mobile: Stacks vertically
- Leaderboard shows only top 5 entries
- Both sections are equal width

**Layout:**
```
┌─────────────────────┬─────────────────────┐
│   Your Stats        │  Today's Top 5      │
│   - Total Games     │  1. Player A        │
│   - Win Rate        │  2. Player B        │
│   - Streaks         │  3. Player C        │
│   - Distribution    │  4. Player D        │
│                     │  5. Player E        │
└─────────────────────┴─────────────────────┘
```

### 5. ✅ Build Verification
- All TypeScript errors fixed
- Build completes successfully
- No linting errors
- All routes generated correctly

## Remaining Tasks

### Task #3: Check Battlefield/Battleground Cards
**Question:** Which cards should be excluded from Riftle?

**Investigation Needed:**
1. Check which cards have `type: "Battlefield"` or `type: "Battleground"`
2. Verify their attribute values (energy, might, power, faction, rarity)
3. Decide if they should be excluded from puzzle selection

**Query to run:**
```sql
SELECT 
  name,
  set_code,
  collector_number,
  metadata->>'type' as type,
  metadata->>'classification'->>'type' as classification_type,
  rarity
FROM cards
WHERE 
  metadata->>'type' IN ('Battlefield', 'Battleground')
  OR metadata->'classification'->>'type' IN ('Battlefield', 'Battleground')
ORDER BY set_code, collector_number;
```

**If exclusion needed:**
Update `lib/riftle/puzzle.ts` to filter out these cards:
```typescript
.not('metadata->type', 'in', '("Battlefield","Battleground")')
```

## Testing Checklist

- [x] Build compiles successfully
- [ ] Max guesses = 6 works correctly
- [ ] Guess labels display properly
- [ ] Card image shows on game over
- [ ] Stats and leaderboard are side-by-side
- [ ] Leaderboard shows only top 5
- [ ] Mobile layout stacks correctly
- [ ] Stats distribution includes guess #6
- [ ] Failed games still tracked correctly

## Files Modified

1. `lib/riftle/config.ts` - Changed MAX_GUESSES to 6
2. `app/riftle/page.tsx` - Added:
   - Image import
   - Guess number labels
   - Card image display
   - Side-by-side layout
   - Top 5 limit on leaderboard
   - Guess #6 in stats distribution

## Configuration

All settings are in `lib/riftle/config.ts`:
```typescript
export const RIFTLE_CONFIG = {
  MAX_GUESSES: 6,              // ← Changed from 5
  EXCLUDE_RECENT_DAYS: 30,
  PUZZLE_BUFFER_DAYS: 3,
}
```

## Next Steps

1. Test the game with 6 guesses
2. Verify stats update correctly
3. Check leaderboard sorting (wins first, then losses)
4. Investigate battlefield/battleground cards
5. Decide on exclusion criteria
6. Update puzzle selection if needed