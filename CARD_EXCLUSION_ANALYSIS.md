# Card Exclusion Analysis for Riftle Daily Puzzles

## Summary

**Total Cards in Database:** 942  
**Cards to EXCLUDE:** 344 (36.5%)  
**Cards ELIGIBLE for Puzzles:** 598 (63.5%)

## Exclusion Breakdown

### 1. Battlefield Cards: 78 cards
- **Type:** `metadata->classification->type = "Battlefield"`
- **Reason:** These are location cards, not playable units/spells
- **Stats:** All have `null` for Cost, Might, and Power
- **Examples:**
  - Altar to Unity (OGN-275/298)
  - Emperor's Dais (SFD-207/221)
  - Targon's Peak (OGN-289/298)
  - The Grand Plaza (OGN-293/298)

### 2. Foil Cards: 297 cards
- **Type:** `metadata->variant = "foil"`
- **Reason:** Duplicate versions of normal cards with foil treatment
- **Note:** Every foil card has a corresponding normal version
- **Examples:**
  - Against the Odds (Foil) (SFD-001/221)
  - Annie, Fiery (Foil) (OGS-001/024)
  - All battlefield cards also have foil versions

### 3. Signature Cards: 8 cards
- **Type:** `metadata->metadata->signature = true`
- **Reason:** Special signature/variant versions of cards
- **Note:** These are premium/special editions
- **Count:** Only 8 signature cards in the database

## Overlap Analysis

Some cards fall into multiple categories:
- **Foil Battlefields:** Cards that are both Battlefield type AND foil variant
- **Total Unique Excluded Cards:** 344 (after deduplication)

## Eligible Card Types

Cards that WILL be included in puzzles:
- ✅ **Units** (normal variant only)
- ✅ **Spells** (normal variant only)
- ✅ **Gear** (normal variant only)
- ✅ **Runes** (normal variant only)
- ✅ **Legends** (normal variant only)

## Sample Eligible Cards

```
• Against the Odds (SFD-001/221)
  Type: Spell, Rarity: Common
  Stats: Cost=2, Might=null, Power=null

• Annie, Fiery (OGS-001/024)
  Type: Unit, Rarity: Epic
  Stats: Cost=5, Might=4, Power=1

• Blazing Scorcher (OGN-001/298)
  Type: Unit, Rarity: Common
  Stats: Cost=5, Might=5, Power=null
```

## SQL Query for Exclusion

```sql
-- Get all eligible cards for Riftle puzzles
SELECT *
FROM cards
WHERE 
  metadata->classification->>'type' != 'Battlefield'
  AND metadata->>'variant' != 'foil'
  AND metadata->metadata->>'signature' != 'true';
```

## Implementation in Code

### TypeScript/Supabase Query

```typescript
const { data: eligibleCards } = await supabase
  .from('cards')
  .select('*')
  .neq('metadata->classification->>type', 'Battlefield')
  .neq('metadata->>variant', 'foil')
  .neq('metadata->metadata->>signature', 'true');
```

### Exclusion Criteria Summary

Cards are EXCLUDED if they match ANY of:
1. `metadata->classification->type = "Battlefield"`
2. `metadata->variant = "foil"`
3. `metadata->metadata->signature = true`

This ensures puzzles use only standard, playable unit/spell/gear cards.

## Rationale

### Why Exclude Battlefields?
- Not playable cards in the traditional sense
- Have no combat stats (Cost, Might, Power all null)
- Would make puzzles impossible or meaningless

### Why Exclude Foils?
- Exact duplicates of normal cards
- Would create duplicate puzzles
- Reduces variety and makes game repetitive

### Why Exclude Signatures?
- Special premium versions
- May have different attributes or be confusing
- Keeps puzzle pool consistent with standard play

## Impact on Puzzle Generation

With 598 eligible cards:
- **Daily puzzles for ~1.6 years** without repeats
- Good variety across card types and rarities
- Sufficient pool for interesting gameplay
- Can implement "seen cards" tracking to avoid recent repeats

## Verification Script

Run `scripts/check-excluded-cards.ts` to verify exclusion criteria:

```bash
npx tsx scripts/check-excluded-cards.ts
```

This will show:
- All battlefield cards
- All foil cards  
- All signature cards
- Summary statistics
- Sample eligible cards

## Next Steps

1. ✅ Exclusion criteria identified and verified
2. ⏳ Update puzzle generation logic to apply filters
3. ⏳ Test puzzle generation with filtered card pool
4. ⏳ Verify no excluded cards appear in puzzles
5. ⏳ Deploy to production

## Files to Update

1. **`lib/riftle/puzzle.ts`** - Add exclusion filters to card selection query
2. **`scripts/generate-daily-puzzle.ts`** - Apply same filters
3. **`app/api/riftle/cards/route.ts`** - Ensure search only returns eligible cards

## Database Query Performance

The exclusion queries use JSONB operators which are indexed:
- `metadata->classification->>type` - Fast with GIN index
- `metadata->>variant` - Fast with GIN index
- `metadata->metadata->>signature` - Fast with GIN index

No performance concerns expected with 942 total cards.